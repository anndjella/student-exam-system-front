import { useEffect, useId, useRef, useState } from "react";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5.5 10.2 2.8 2.8 6.2-6.2" />
    </svg>
  );
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  loading = false,
  ariaLabel,
}) {
  const listboxId = useId();
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex(
    (option) => String(option.value) === String(value)
  );
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    });
  }, [activeIndex, open]);

  function openMenu() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function choose(option) {
    onChange(String(option.value));
    setOpen(false);
    requestAnimationFrame(() => rootRef.current?.querySelector("button")?.focus());
  }

  function handleKeyDown(event) {
    if (disabled || loading || options.length === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (activeIndex + direction + options.length) % options.length;
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (!open) openMenu();
      const nextIndex = event.key === "Home" ? 0 : options.length - 1;
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
    }

    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
    }
  }

  return (
    <div
      className={`custom-select${open ? " is-open" : ""}${
        disabled || loading ? " is-disabled" : ""
      }`}
      ref={rootRef}
    >
      <button
        className="custom-select-trigger"
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
        disabled={disabled || loading}
        onClick={() => {
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? "custom-select-value" : "custom-select-placeholder"}>
          {loading ? "Loading..." : selectedOption?.label || placeholder}
        </span>
        <span className="custom-select-chevron">
          <ChevronIcon />
        </span>
      </button>

      {open ? (
        <div className="custom-select-menu">
          <div className="custom-select-menu-label">{ariaLabel}</div>
          <div className="custom-select-options" id={listboxId} role="listbox">
            {options.map((option, index) => {
              const selected = index === selectedIndex;
              const active = index === activeIndex;
              return (
                <button
                  className={`custom-select-option${selected ? " is-selected" : ""}${
                    active ? " is-active" : ""
                  }`}
                  id={`${listboxId}-${index}`}
                  key={option.key ?? option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <span className="custom-select-check">
                      <CheckIcon />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="custom-select-menu-footer">
            {options.length} {options.length === 1 ? "option" : "options"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
