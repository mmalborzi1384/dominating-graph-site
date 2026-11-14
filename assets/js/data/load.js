import { validateTeaching, validateTeachingSources } from './validate.js';
async function read(relative) {
  const response = await fetch(new URL(relative, import.meta.url));
  if (!response.ok) throw new Error('فایل آموزش بارگیری نشد.');
  return response.json();
}
export async function loadTeaching() {
  const [curriculum, overrides, bank, legacyCurriculum, previousCurriculum, sources] = await Promise.all([
    read('../../../content/teaching.json'), read('../../../content/question-overrides.json'),
    read('../../../docs/question-bank.json'), read('../../../content/teaching-v1.json'),
    read('../../../content/teaching-v2.json'), read('../../../content/teaching-sources.json'),
  ]);
  const teaching=validateTeaching(curriculum, overrides, bank);
  if(curriculum.curriculumVersion===3){validateTeaching(previousCurriculum,null,bank);validateTeachingSources(sources,bank,curriculum);}
  return {...teaching,legacyCurriculum,previousCurriculum,sources};
}
