import * as React from 'react';

import { XIcon } from '@shared/icons';

interface InputSearchProps extends React.ComponentProps<'input'> {
  onClear?: () => void;
  leadingButton?: React.ReactNode;
}

export const InputSearch = ({ onClear, leadingButton, onFocus, onBlur, value, ref, ...props }: InputSearchProps) => {
  const [focused, setFocused] = React.useState(false);

  const showClear = focused && (value as string).length > 0 && !props.readOnly && !props.disabled && !!onClear;

  return (
    <div className="flex items-center gap-2 w-full rounded-full bg-black h-[40px] px-3 py-2 shadow-md">
      {leadingButton && leadingButton}
      <input
        ref={ref}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-400"
        {...props}
      />
      {showClear && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onClear();
          }}
          className="flex h-4 w-4 shrink-0 items-center justify-center text-black bg-gray-400 rounded-full"
        >
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
