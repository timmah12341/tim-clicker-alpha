
const BLOCKED_WORDS = [
  'nazi', 'hitler', 'rape', 'fuck', 'shit', 'piss', 'cunt', 'slut', 'whore', 'bastard',
  'nigga', 'nigger', 'faggot', 'retard', 'autism', 'autistic', 'pedo', 'pedophile',
  'porn', 'sex', 'dick', 'cock', 'penis', 'vagina', 'asshole', 'cum'
];

function isNameOffensive(name) {
  if (!name) return false;
  var lowerName = name.toLowerCase();
  for (var i = 0; i < BLOCKED_WORDS.length; i++) {
    if (lowerName.indexOf(BLOCKED_WORDS[i]) >= 0) {
      return true;
    }
  }
  return false;
}

function validateName(name) {
  if (!name) return { valid: false, error: 'Name cannot be empty.' };
  var trimmed = name.trim();
  if (trimmed.length < 2) return { valid: false, error: 'Name is too short.' };
  if (trimmed.length > 25) return { valid: false, error: 'Name is too long (max 25 characters).' };
  if (isNameOffensive(trimmed)) {
    return { valid: false, error: 'Name contains offensive language.' };
  }
  return { valid: true };
}

// Tests
console.log('Test "GoodPlayer":', validateName('GoodPlayer'));
console.log('Test "fuck":', validateName('fuck'));
console.log('Test "Hitler123":', validateName('Hitler123'));
console.log('Test "a":', validateName('a'));
console.log('Test empty:', validateName(''));
