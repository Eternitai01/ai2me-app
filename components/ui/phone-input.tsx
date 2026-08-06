"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common country codes
const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸", limit: 10 },
  { code: "+1", country: "CA", flag: "🇨🇦", limit: 10 },
  { code: "+44", country: "UK", flag: "🇬🇧", limit: 10 },
  { code: "+91", country: "IN", flag: "🇮🇳", limit: 10 },
  { code: "+49", country: "DE", flag: "🇩🇪", limit: 11 },
  { code: "+33", country: "FR", flag: "🇫🇷", limit: 9 },
  { code: "+61", country: "AU", flag: "🇦🇺", limit: 9 },
  { code: "+81", country: "JP", flag: "🇯🇵", limit: 10 },
  { code: "+86", country: "CN", flag: "🇨🇳", limit: 11 },
  { code: "+55", country: "BR", flag: "🇧🇷", limit: 11 },
  { code: "+52", country: "MX", flag: "🇲🇽", limit: 10 },
  { code: "+39", country: "IT", flag: "🇮🇹", limit: 10 },
  { code: "+34", country: "ES", flag: "🇪🇸", limit: 9 },
  { code: "+31", country: "NL", flag: "🇳🇱", limit: 9 },
  { code: "+46", country: "SE", flag: "🇸🇪", limit: 10 },
  { code: "+41", country: "CH", flag: "🇨🇭", limit: 9 },
  { code: "+65", country: "SG", flag: "🇸🇬", limit: 8 },
  { code: "+971", country: "AE", flag: "🇦🇪", limit: 9 },
  { code: "+966", country: "SA", flag: "🇸🇦", limit: 9 },
  { code: "+82", country: "KR", flag: "🇰🇷", limit: 10 },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  placeholder = "Phone number",
  className = "",
  error = false,
}: PhoneInputProps) {
  // Parse the value to find the best matching country code
  const getCountryFromValue = (val: string) => {
    if (!val) return null;

    // Check for exact matches with country suffixes if we decide to store them that way
    // or just find the longest matching prefix
    const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);

    for (const country of sortedCodes) {
      if (val.startsWith(country.code)) {
        // If there's more after the code, it should be a space or digit
        const afterCode = val.substring(country.code.length);
        if (afterCode === "" || afterCode.startsWith(" ") || /^\d/.test(afterCode)) {
          return `${country.code}-${country.country}`;
        }
      }
    }
    return null;
  };

  // Initialize from value if it starts with a country code
  const [countryCode, setCountryCode] = React.useState(() => {
    return getCountryFromValue(value) || "+1-US"; 
  });
  const [phoneNumber, setPhoneNumber] = React.useState("");

  // Keep internal state in sync with external value prop
  React.useEffect(() => {
    if (value) {
      const codeWithCountry = getCountryFromValue(value);
      if (codeWithCountry) {
        setCountryCode(codeWithCountry);
        const codeOnly = codeWithCountry.split("-")[0];
        const numberPart = value.substring(codeOnly.length).trim();
        setPhoneNumber(numberPart);
      } else if (value.startsWith("+")) {
        const match = value.match(/^(\+\d{1,4})(\s+)?(.*)$/);
        if (match) {
          setCountryCode(match[1]);
          setPhoneNumber(match[3] || "");
        }
      } else {
        setPhoneNumber(value);
      }
    } else {
      // If value is explicitly cleared from parent
      setPhoneNumber("");
    }
  }, [value]);

  const handleCountryCodeChange = (newCodeWithCountry: string) => {
    const actualCode = newCodeWithCountry.split("-")[0];
    setCountryCode(newCodeWithCountry);
    // Persist the country code even if phoneNumber is empty
    onChange(phoneNumber ? `${actualCode} ${phoneNumber}` : actualCode);
  };

  const getCurrentLimit = () => {
    const matched = countryCodes.find(
      (c) => `${c.code}-${c.country}` === countryCode
    );
    return matched?.limit || 15;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limit = getCurrentLimit();
    const newNumber = e.target.value.replace(/\D/g, "").slice(0, limit);
    const actualCode = countryCode.split("-")[0];
    setPhoneNumber(newNumber);
    // Persist the country code even if number is empty
    onChange(newNumber ? `${actualCode} ${newNumber}` : actualCode);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={countryCode} onValueChange={handleCountryCodeChange}>
        <SelectTrigger className={`w-[100px] h-12 !shadow-none border-1 ${error ? 'border-red-500' : 'border-[#C3CAD180]'} rounded-xl text-foreground`}>
          <SelectValue placeholder="+1" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {countryCodes.map((country, index) => (
            <SelectItem key={`${country.code}-${country.country}-${index}`} value={`${country.code}-${country.country}`}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        inputMode="numeric"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={getCurrentLimit()}
        className={`flex-1 h-12 rounded-xl border-1 ${error ? 'border-red-500' : 'border-[#C3CAD180]'} focus-visible:shadow-none focus-visible:outline-none text-foreground`}
      />
    </div>
  );
}

