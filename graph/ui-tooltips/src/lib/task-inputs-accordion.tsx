import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export interface TaskInputsAccordionProps {
  id: string; // task input id
  inputs: Record<string, string[]>; // task input id
  className?: string;
  title?: string;
}

export function TaskInputsAccordion({
  id,
  inputs,
  className,
  title = 'Inputs',
}: TaskInputsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setIsOpen(false);
  }, [id]);
  const project = id.split(':')[0];
  if (inputs && Object.keys(inputs).length === 0) return null;
  return (
    <div
      className={`${className} overflow-auto w-full min-w-[350px] max-w-full rounded-md border border-slate-200 dark:border-slate-800 w-full`}
    >
      <div
        className="flex justify-between items-center w-full bg-slate-50 px-4 py-2 text-xs font-medium uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        onClick={() => setIsOpen(!isOpen)}
        data-cy="inputs-accordion"
      >
        <span>{title}</span>
        <span>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </span>
      </div>
      <ul
        className={`max-h-[300px] divide-y divide-slate-200 overflow-auto dark:divide-slate-800 ${
          !isOpen && 'hidden'
        }`}
      >
        {Object.entries(inputs ?? {})
          .sort(compareInputSectionKeys(project))
          .map(([key, files]) => {
            if (!files.length) return undefined;
            if (key === 'general' || key === project) {
              return renderInputs(files);
            }
            if (key === 'external') {
              return InputAccordion({ section: 'External Inputs', files });
            }

            return InputAccordion({ section: key, files });
          })}
      </ul>
    </div>
  );
}

function InputAccordion({
  section,
  files,
}: {
  section: string;
  files: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return [
    <li
      id={section}
      key={section}
      className="flex justify-between items-center whitespace-nowrap px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-300"
      onClick={() => setIsOpen(!isOpen)}
      data-cy="input-section-entry"
    >
      <span className="block truncate font-normal font-bold">{section}</span>
      <span>
        {isOpen ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </span>
    </li>,
    isOpen ? renderInputs(files) : undefined,
  ];
}

function renderInputs(files: string[]) {
  return files.map((file) => (
    <li
      key={file}
      className="whitespace-nowrap px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-300"
      title={file}
      data-cy="input-list-entry"
    >
      <span className="block truncate font-normal">{file}</span>
    </li>
  ));
}

function compareInputSectionKeys(project: string) {
  return ([keya]: [string, string[]], [keyb]: [string, string[]]) => {
    const first = 'general';
    const second = project;
    const last = 'external';

    // Check if 'keya' and/or 'keyb' are one of the special strings
    if (
      keya === first ||
      keya === second ||
      keya === last ||
      keyb === first ||
      keyb === second ||
      keyb === last
    ) {
      // If 'keya' is 'general', 'keya' should always be first
      if (keya === first) return -1;
      // If 'keyb' is 'general', 'keyb' should always be first
      if (keyb === first) return 1;
      // At this point, we know neither 'keya' nor 'keyb' are 'general'
      // If 'keya' is project, 'keya' should be second (i.e., before 'keyb' unless 'keyb' is 'general')
      if (keya === second) return -1;
      // If 'keyb' is project, 'keyb' should be second (i.e., before 'keya')
      if (keyb === second) return 1;
      // At this point, we know neither 'keya' nor 'keyb' are 'general' or project
      // If 'keya' is 'external', 'keya' should be last (i.e., after 'keyb')
      if (keya === last) return 1;
      // If 'keyb' is 'external', 'keyb' should be last (i.e., after 'keya')
      if (keyb === last) return -1;
    }

    // If neither 'keya' nor 'b' are one of the special strings, sort alphabetically
    if (keya < keyb) {
      return -1;
    }
    if (keya > keyb) {
      return 1;
    }
    return 0;
  };
}
