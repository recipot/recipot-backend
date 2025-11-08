import * as fs from 'fs';
import * as path from 'path';

/**
 * 템플릿 파일을 읽고 변수를 치환합니다.
 * @param templateName 템플릿 파일명 (확장자 제외)
 * @param variables 치환할 변수 객체
 * @returns 치환된 템플릿 문자열
 */
export function renderTemplate(
  templateName: string,
  variables: Record<string, string>,
): string {
  const templateDir = path.join(__dirname, '../templates');
  const templatePath = path.join(templateDir, `${templateName}.html`);

  let template = fs.readFileSync(templatePath, 'utf-8');

  // CSS 파일 읽기
  if (template.includes('{{CSS}}')) {
    const cssPath = path.join(templateDir, `${templateName}.css`);
    const css = fs.readFileSync(cssPath, 'utf-8');
    template = template.replace('{{CSS}}', css);
  }

  // 변수 치환
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    template = template.replace(new RegExp(placeholder, 'g'), value);
  });

  return template;
}
