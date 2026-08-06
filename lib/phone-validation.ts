import { isValidPhoneNumber, parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

/**
 * Validates a phone number based on the country code.
 * @param phoneNumber The phone number string (with or without country code)
 * @param countryCode The ISO 3166-1 alpha-2 country code (e.g., 'US', 'IN')
 * @returns boolean indicating if the phone number is valid
 */
export const isPhoneValid = (phoneNumber: string, countryCode?: string): boolean => {
    if (!phoneNumber) return true; // Optional phone field

    try {
        // If it's just a country prefix (e.g., "+91"), consider it "empty" and valid for navigation
        // A valid prefix is "+" followed by 1-4 digits
        if (/^\+\d{1,4}$/.test(phoneNumber)) {
            return true;
        }

        // If it starts with +, use global validation
        if (phoneNumber.startsWith('+')) {
            return isValidPhoneNumber(phoneNumber);
        }

        // Otherwise validate against specific country
        if (countryCode) {
            return isValidPhoneNumber(phoneNumber, countryCode as CountryCode);
        }

        return isValidPhoneNumber(phoneNumber);
    } catch (error) {
        return false;
    }
};

/**
 * Formats a phone number into international format.
 */
export const formatPhoneInternational = (phoneNumber: string, countryCode?: string): string => {
    try {
        const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, countryCode as CountryCode);
        if (phoneNumberObj) {
            return phoneNumberObj.formatInternational();
        }
        return phoneNumber;
    } catch (error) {
        return phoneNumber;
    }
};

/**
 * Cleans the phone number for the backend payload.
 * Returns empty string if the phone number is just a country prefix.
 */
export const cleanPhonePayload = (phoneNumber: string): string => {
    if (!phoneNumber) return "";
    // If it's just a country prefix (e.g., "+91"), it's effectively empty
    if (/^\+\d{1,4}$/.test(phoneNumber.trim())) {
        return "";
    }
    return phoneNumber.trim();
};
