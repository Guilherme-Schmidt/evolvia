import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface TickerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export const TickerAutocomplete = ({ value, onChange, placeholder, id }: TickerAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchTickers = async (search: string) => {
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-tickers', {
        body: { search }
      });

      if (error) throw error;

      if (data?.tickers) {
        setSuggestions(data.tickers);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erro ao buscar tickers:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    searchTickers(newValue);
  };

  const handleSelectTicker = (ticker: string) => {
    onChange(ticker);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder || "Ex: PETR4, MXRF11"}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1">
          <Command className="rounded-lg border shadow-md">
            <CommandList>
              {loading ? (
                <CommandEmpty>Buscando...</CommandEmpty>
              ) : (
                <CommandGroup>
                  {suggestions.map((ticker) => (
                    <CommandItem
                      key={ticker}
                      value={ticker}
                      onSelect={() => handleSelectTicker(ticker)}
                      className="cursor-pointer"
                    >
                      {ticker}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
