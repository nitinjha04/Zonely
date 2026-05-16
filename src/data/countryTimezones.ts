// Curated country -> timezones mapping (not exhaustive) focusing on top commonly selected regions.
// For broader coverage, extend this list.
export interface CountryTimezones {
  code: string
  country: string
  timezones: string[]
}

export const countryTimezones: CountryTimezones[] = [
  { code: 'US', country: 'United States', timezones: [
    'America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu'
  ] },
  { code: 'GB', country: 'United Kingdom', timezones: ['Europe/London'] },
  { code: 'IN', country: 'India', timezones: ['Asia/Kolkata'] },
  { code: 'AU', country: 'Australia', timezones: [
    'Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Perth','Australia/Adelaide'
  ] },
  { code: 'JP', country: 'Japan', timezones: ['Asia/Tokyo'] },
  { code: 'CA', country: 'Canada', timezones: [
    'America/Toronto','America/Vancouver','America/Edmonton','America/Halifax','America/St_Johns'
  ] },
  { code: 'DE', country: 'Germany', timezones: ['Europe/Berlin'] },
  { code: 'FR', country: 'France', timezones: ['Europe/Paris'] },
  { code: 'CN', country: 'China', timezones: ['Asia/Shanghai'] },
  { code: 'BR', country: 'Brazil', timezones: [
    'America/Sao_Paulo','America/Manaus','America/Recife','America/Fortaleza'
  ] },
  { code: 'AE', country: 'United Arab Emirates', timezones: ['Asia/Dubai'] },
  { code: 'RU', country: 'Russia', timezones: [
    'Europe/Moscow','Asia/Yekaterinburg','Asia/Novosibirsk','Asia/Vladivostok'
  ] },
]

export const topCountryCodes = ['US','GB','IN','AU','JP','CA','DE','FR','CN','BR','AE','RU']
