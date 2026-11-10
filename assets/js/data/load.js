import { validateTeaching } from './validate.js';
async function read(relative) {
  const response = await fetch(new URL(relative, import.meta.url));
  if (!response.ok) throw new Error('فایل آموزش بارگیری نشد.');
  return response.json();
}
export async function loadTeaching() {
  const [curriculum, overrides, bank] = await Promise.all([
    read('../../../content/teaching.json'), read('../../../content/question-overrides.json'),
    read('../../../docs/question-bank.json'),
  ]);
  return validateTeaching(curriculum, overrides, bank);
}
