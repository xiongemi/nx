// using https://central.sonatype.org/publish/publish-portal-api/ curl scripts to publish to maven

const { execSync } = require('child_process');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  args.forEach((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    result[key] = value;
  });
  return result;
}

function publishToMavenApi(username, password, deploymentZipPath = 'deployment.zip') {
  let token;
  try {
    token = execSync(`printf "${username}:${password}" | base64`).toString().trim();
  } catch (error) {
    console.error('Error generating token:', error);
    process.exit(1);
  }

  console.log(`Publishing to Maven API with token: ${token}`);

  const url = 'https://central.sonatype.com/api/v1/publisher/upload';
  let uploadResponse;
  try {
    uploadResponse = execSync(
      `curl -X POST ${url} --silent -H "Authorization: Basic ${token}" --form bundle=@${deploymentZipPath}`
    );
  } catch (error) {
    console.error('Error uploading to Maven API:', error);
    process.exit(1);
  }

  const uploadId = uploadResponse.toString().trim();
  console.log(`Upload ID: ${uploadId}`);

  let currentStatus = getUploadStatus(uploadId, token);
  if (['PENDING', 'VALIDATING', 'PUBLISHING'].includes(currentStatus)) {
    currentStatus = retryUntilValidatedOrPublished(currentStatus, uploadId, token);
  }

  if (currentStatus !== 'VALIDATED' && currentStatus !== 'PUBLISHED') {
    console.error(`Upload failed with final status: ${currentStatus}`);
    process.exit(1);
  }

  console.log(`Upload is ${currentStatus}, triggering deployment...`);
  if (currentStatus === 'PUBLISHED') {
    console.log('Already published, no need to trigger deployment.');
    return;
  }

  const deploymentUrl = `https://central.sonatype.com/api/v1/publisher/deployment/${uploadId}`;
  const deploymentResponse = execSync(
    `curl -X POST ${deploymentUrl} --silent -H "Authorization: Basic ${token}"`
  );
  console.log(`Deployment response: ${deploymentResponse.toString()}`);
}

function retryUntilValidatedOrPublished(initialStatus, uploadId, token, retries = 10, delay = 10000) {
  let attempt = 0;
  let status = initialStatus;

  while (attempt < retries) {
    console.log(`Checking status (attempt ${attempt + 1}/${retries})...`);
    status = getUploadStatus(uploadId, token);

    if (status === 'VALIDATED' || status === 'PUBLISHED' || status === 'FAILED') {
      break;
    }

    attempt++;
    sleep(delay);
  }

  return status;
}

function getUploadStatus(uploadId, token) {
  const statusUrl = `https://central.sonatype.com/api/v1/publisher/status?id=${uploadId}`;
  const statusResponse = execSync(
    `curl -X POST ${statusUrl} --silent -H "Authorization: Basic ${token}"`
  );
  const parsed = JSON.parse(statusResponse.toString());

  console.log(`Current deployment state: ${parsed.deploymentState}`);
  return parsed.deploymentState;
}

function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {} // simple blocking wait
}

// Entry
let { username, password, deploymentZipPath } = parseArgs();

username = username ?? process.env.MAVEN_USERNAME;
password = password ?? process.env.MAVEN_PASSWORD;

if (!username || !password) {
  console.error('Missing MAVEN_USERNAME or MAVEN_PASSWORD');
  process.exit(1);
}

if (!deploymentZipPath) {
  console.error('Missing required --deploymentZipPath argument');
  process.exit(1);
}

publishToMavenApi(username, password, deploymentZipPath);
