/* ===== Message Generator Module ===== */

const Generator = {
  // Message templates - placeholder messages to be replaced with final text
  templates: {
    mom: {
      birthday: "Happy Birthday, {name}! Today is all about you, and I want you to know how much you mean to me. Your love, warmth, and endless support have shaped who I am today. May this year bring you all the happiness and joy you deserve. I love you more than words can say!",
      thankYou: "Dear {name}, thank you from the bottom of my heart. {reason} You have always been my guiding light, my safe haven, and my biggest cheerleader. I am so grateful to have you in my life. Thank you for everything you do, big and small.",
      justBecause: "Dear {name}, just wanted you to know that you are loved and appreciated every single day. You make the world a better place just by being in it. Thinking of you today and sending all my love.",
      anniversary: "Happy Anniversary, {name}! Another year of beautiful memories together. {years} Your love has been the foundation of our family, and I cherish every moment we share. Here's to many more years of love and laughter.",
      appreciation: "{name}, I want you to know how much I appreciate you. {reason} You give so much of yourself to everyone around you, and it never goes unnoticed. You are truly one of a kind, and I'm blessed to have you."
    },
    sister: {
      birthday: "Happy Birthday, {name}! Having a sister like you is one of life's greatest gifts. Through every laugh, every tear, and every adventure, you've been right there beside me. May your day be as wonderful as you are!",
      thankYou: "Dear {name}, I just want to say thank you. {reason} You're not just my sister, you're my best friend. Your support and love mean the world to me, and I'm so lucky to have you.",
      justBecause: "Hey {name}, just thinking about you and wanted to send some love your way. You're an amazing sister and an even more amazing person. Never forget that!",
      anniversary: "Happy Anniversary, {name}! {years} Watching your love grow has been beautiful. May your journey together continue to be filled with love and happiness.",
      appreciation: "{name}, I appreciate you more than you know. {reason} You're the kind of sister everyone wishes they had, and I'm grateful every day that you're mine."
    },
    aunt: {
      birthday: "Happy Birthday, {name}! You're not just an aunt, you're a second mom, a mentor, and a friend. Your love and guidance have meant so much to me over the years. Wishing you a day as special as you are!",
      thankYou: "Dear {name}, thank you for everything. {reason} You've always been there with open arms and a warm heart. Your kindness and generosity inspire me every day.",
      justBecause: "Dear {name}, just wanted to drop you a note to say you're wonderful. Your warmth and love light up every room you walk into. Sending you a big hug!",
      anniversary: "Happy Anniversary, {name}! {years} Your love story is truly inspiring. Wishing you both continued happiness and beautiful memories together.",
      appreciation: "{name}, I want you to know how much I appreciate you. {reason} You bring so much joy and warmth to our family. Thank you for being you."
    },
    dad: {
      birthday: "Happy Birthday, {name}! You've been my hero since day one. Your strength, wisdom, and unconditional love have guided me through life. Today, I celebrate you and all that you are. I love you!",
      thankYou: "Dear {name}, thank you for being the incredible person you are. {reason} Your support and encouragement have meant more to me than you'll ever know. I'm proud to call you family.",
      justBecause: "Hey {name}, just wanted to remind you how amazing you are. Your presence brings so much warmth and joy. Thinking of you today!",
      anniversary: "Happy Anniversary, {name}! {years} Your dedication and love are an inspiration. Here's to many more wonderful years together.",
      appreciation: "{name}, I appreciate everything you do. {reason} You're a rock, a guide, and a friend all rolled into one. Thank you for being you."
    },
    friend: {
      birthday: "Happy Birthday, {name}! Friends like you are rare and precious. Thank you for all the laughs, the support, and the unforgettable moments. Here's to another amazing year of friendship!",
      thankYou: "Dear {name}, I just wanted to say thank you. {reason} True friends are hard to find, and I'm so lucky to have you in my life. Your friendship means everything to me.",
      justBecause: "Hey {name}! No special reason, just thinking about you and wanted to send some love. You're an incredible friend and person. Never change!",
      anniversary: "Happy Anniversary, {name}! {years} May your love continue to grow stronger with each passing day. Wishing you all the happiness in the world.",
      appreciation: "{name}, I appreciate you more than words can say. {reason} You're the kind of friend everyone deserves but few are lucky enough to have. Thank you for being you."
    },
    partner: {
      birthday: "Happy Birthday, my love, {name}! Every moment with you is a gift. Your love fills my heart with joy and my life with meaning. Today, I celebrate the amazing person you are. I love you endlessly!",
      thankYou: "My dearest {name}, thank you for being you. {reason} Your love, patience, and understanding make every day better. I'm so grateful to walk through life with you.",
      justBecause: "My love, {name}, just wanted to remind you how deeply you are loved. You are my heart, my home, and my happiness. Every day with you is a blessing.",
      anniversary: "Happy Anniversary, my love, {name}! {years} Every day by your side is a treasure. Our love story is my favorite adventure, and I can't wait for all the chapters still to come.",
      appreciation: "{name}, I appreciate you with all my heart. {reason} You make me a better person, and I fall in love with you more every day. Thank you for being my everything."
    }
  },

  // Generate a message based on data
  generateMessage(data) {
    const { relationship, occasion, name, fields } = data;
    const template = this.templates[relationship]?.[occasion];

    if (!template) {
      return `Dear ${name}, thinking of you today with love and warmth.`;
    }

    let message = template.replace(/{name}/g, name);

    // Replace occasion-specific placeholders
    if (occasion === 'thankYou' && fields.reason) {
      message = message.replace(/{reason}/g, fields.reason);
    }
    if (occasion === 'appreciation' && fields.reason) {
      message = message.replace(/{reason}/g, fields.reason);
    }
    if (occasion === 'anniversary' && fields.years) {
      message = message.replace(/{years}/g, `Celebrating ${fields.years} beautiful year${fields.years > 1 ? 's' : ''} together.`);
    } else if (occasion === 'anniversary') {
      message = message.replace(/{years}/g, '');
    }

    return message;
  },

  // Get greeting based on relationship and occasion
  getGreeting(data) {
    const { relationship, occasion, name } = data;
    const greetings = {
      mom: {
        birthday: `Happy Birthday, dear ${name}!`,
        thankYou: `Thank You, Mom`,
        justBecause: `Thinking of You, ${name}`,
        anniversary: `Happy Anniversary, ${name}`,
        appreciation: `For My Beloved Mom`
      },
      sister: {
        birthday: `Happy Birthday, ${name}!`,
        thankYou: `Thank You, ${name}`,
        justBecause: `Hey ${name}!`,
        anniversary: `Happy Anniversary, ${name}`,
        appreciation: `For My Dear Sister`
      },
      aunt: {
        birthday: `Happy Birthday, ${name}!`,
        thankYou: `Thank You, ${name}`,
        justBecause: `Thinking of You, ${name}`,
        anniversary: `Happy Anniversary, ${name}`,
        appreciation: `For My Wonderful Aunt`
      },
      dad: {
        birthday: `Happy Birthday, ${name}!`,
        thankYou: `Thank You, Dad`,
        justBecause: `Hey ${name}!`,
        anniversary: `Happy Anniversary, ${name}`,
        appreciation: `For My Amazing Dad`
      },
      friend: {
        birthday: `Happy Birthday, ${name}!`,
        thankYou: `Thank You, ${name}`,
        justBecause: `Hey ${name}!`,
        anniversary: `Happy Anniversary, ${name}`,
        appreciation: `For My Special Friend`
      },
      partner: {
        birthday: `Happy Birthday, My Love!`,
        thankYou: `Thank You, My Love`,
        justBecause: `My Dearest ${name}`,
        anniversary: `Happy Anniversary, My Love`,
        appreciation: `For My Everything`
      }
    };

    return greetings[relationship]?.[occasion] || `Dear ${name}`;
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
      partner: "Forever and always, yours"
    };
    return footers[relationship] || "With love";
  },

  // Calculate birthday info
  getBirthdayInfo(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
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

  // Get occasion-specific details for display
  getOccasionDetails(data) {
    const { occasion, fields } = data;
    let details = '';

    if (occasion === 'birthday' && fields.dob) {
      const info = this.getBirthdayInfo(fields.dob);
      if (info) {
        details = `Turning ${info.age + 1}! ${info.daysUntil === 0 ? 'Today is the day!' : info.daysUntil + ' days until the big day!'}`;
      }
    }
    if (occasion === 'anniversary' && fields.anniversaryDate) {
      details = `Celebrating since ${new Date(fields.anniversaryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    }

    return details;
  }
};

window.Generator = Generator;
