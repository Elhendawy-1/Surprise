/* ===== Message Generator Module ===== */

const Generator = {
  // Birthday message templates - placeholder messages to be replaced with final text
  templates: {
    mom: "Happy Birthday, {name}! Today is all about you, and I want you to know how much you mean to me. Your love, warmth, and endless support have shaped who I am today. May this year bring you all the happiness and joy you deserve. I love you more than words can say!",
    sister: "Happy Birthday, {name}! Having a sister like you is one of life's greatest gifts. Through every laugh, every tear, and every adventure, you've been right there beside me. May your day be as wonderful as you are!",
    aunt: "Happy Birthday, {name}! You're not just an aunt, you're a second mom, a mentor, and a friend. Your love and guidance have meant so much to me over the years. Wishing you a day as special as you are!",
    dad: "Happy Birthday, {name}! You've been my hero since day one. Your strength, wisdom, and unconditional love have guided me through life. Today, I celebrate you and all that you are. I love you!",
    friend: "Happy Birthday, {name}! Friends like you are rare and precious. Thank you for all the laughs, the support, and the unforgettable moments. Here's to another amazing year of friendship!",
    brother: "Happy Birthday, {name}! Having a brother like you is one of life's greatest gifts. Through every laugh, every adventure, and every challenge, you've been right there beside me. May your day be as awesome as you are!",
    other: "Happy Birthday, {name}! Today is all about you. Thank you for being such a special part of my life - your kindness, laughter, and warmth mean more than you know. May this year bring you everything you deserve and more!"
  },

  // Generate a birthday message based on data
  generateMessage(data) {
    const { relationship, name } = data;
    const template = this.templates[relationship];

    if (!template) {
      return `Happy Birthday, ${name}! Wishing you a wonderful day filled with love, laughter, and everything you deserve.`;
    }

    return template.replace(/{name}/g, name);
  },

  // Get birthday greeting based on relationship
  getGreeting(data) {
    const { relationship, name } = data;
    const greetings = {
      mom: `Happy Birthday, dear ${name}!`,
      sister: `Happy Birthday, ${name}!`,
      aunt: `Happy Birthday, ${name}!`,
      dad: `Happy Birthday, ${name}!`,
      friend: `Happy Birthday, ${name}!`,
      brother: `Happy Birthday, ${name}!`,
      other: `Happy Birthday, ${name}!`
    };

    return greetings[relationship] || `Happy Birthday, ${name}!`;
  },

  // Get footer text
  getFooter(data) {
    const { relationship } = data;
    const footers = {
      mom: "With all my love, your child",
      sister: "With love, your sibling",
      aunt: "With love and gratitude",
      dad: "With all my love, your child",
      friend: "With love, your friend",
      brother: "With love, your sibling",
      other: "With lots of love"
    };
    return footers[relationship] || "With love";
  },

  // Calculate birthday info
  getBirthdayInfo(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }
    const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    return { age, daysUntil, nextBirthday };
  },

  // Get birthday details for display
  getOccasionDetails(data) {
    const { fields } = data;
    if (fields && fields.dob) {
      const info = this.getBirthdayInfo(fields.dob);
      if (info) {
        return `Turning ${info.age + 1}! ${info.daysUntil === 0 ? 'Today is the day!' : info.daysUntil + ' days until the big day!'}`;
      }
    }

    return '';
  }
};

window.Generator = Generator;
