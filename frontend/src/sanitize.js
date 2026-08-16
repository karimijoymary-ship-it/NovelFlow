export function stripEmoji(str) {
 if (!str || typeof str !== 'string') return str || '';
 return str
 .replace(/[\uFE00-\uFE0F\u200D]/g, '')
 .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
 .replace(/[\u{2600}-\u{27BF}]/gu, '')
 .replace(/[\u{2300}-\u{25FF}]/gu, '')
 .replace(/|||||||||||||||||||||||||||/g, '')
 .replace(/ +/g, ' ')
 .trim();
}
