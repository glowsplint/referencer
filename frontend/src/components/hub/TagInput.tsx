import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { normalizeTag, isValidTag, MAX_TAGS_PER_DOC } from "@/lib/tag-utils";

interface TagInputProps {
  documentId: string;
  currentTags: string[];
  allTags: string[];
  onAddTag: (documentId: string, tag: string) => void;
  onRemoveTag: (documentId: string, tag: string) => void;
}

export function TagInput({
  documentId,
  currentTags,
  allTags,
  onAddTag,
  onRemoveTag,
}: TagInputProps) {
  const { t } = useTranslation("management");
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = inputValue.trim()
    ? allTags.filter((tag) => tag.includes(normalizeTag(inputValue)) && !currentTags.includes(tag))
    : [];

  useEffect(() => {
    setHighlightIndex(-1);
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (value: string) => {
    const tag = normalizeTag(value);
    if (!tag) return;

    if (!isValidTag(tag)) {
      setError(t("hub.invalidTag"));
      return;
    }

    if (currentTags.length >= MAX_TAGS_PER_DOC) {
      setError(t("hub.maxTagsReached", { max: MAX_TAGS_PER_DOC }));
      return;
    }

    if (currentTags.includes(tag)) {
      setInputValue("");
      setError(null);
      return;
    }

    onAddTag(documentId, tag);
    setInputValue("");
    setError(null);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        handleSubmit(suggestions[highlightIndex]);
      } else {
        handleSubmit(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {/* Tag chips */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {currentTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
            >
              #{tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag(documentId, tag);
                }}
                className="hover:text-destructive transition-colors"
                aria-label={t("hub.removeTag")}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setError(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("hub.addTag")}
          className="w-full h-7 rounded-md border border-border bg-background px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          data-testid="tagInput"
        />

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-[150px] overflow-y-auto">
            {suggestions.map((tag, index) => (
              <button
                key={tag}
                className={`w-full text-left px-2 py-1.5 text-xs hover:bg-accent transition-colors ${
                  index === highlightIndex ? "bg-accent" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSubmit(tag);
                }}
                data-testid={`tagSuggestion-${tag}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive" data-testid="tagError">
          {error}
        </p>
      )}
    </div>
  );
}
