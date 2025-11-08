import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 템플릿 캐시
 */
const templateCache = new Map<string, string>();

/**
 * 템플릿 디렉토리 경로
 */
const templateDir = path.join(__dirname, '../templates');

/**
 * 템플릿 이름의 유효성을 검증합니다.
 * @param templateName 템플릿 파일명
 * @throws Error 유효하지 않은 템플릿 이름인 경우
 */
function validateTemplateName(templateName: string): void {
  if (!templateName || typeof templateName !== 'string') {
    throw new Error('Template name must be a non-empty string');
  }

  // 경로 탐색 방지: 파일명에 슬래시나 백슬래시가 포함되지 않도록 검증
  if (/[/\\]/.test(templateName)) {
    throw new Error('Invalid template name: path traversal is not allowed');
  }

  // 상대 경로 방지
  if (templateName.startsWith('.') || templateName.includes('..')) {
    throw new Error('Invalid template name: relative paths are not allowed');
  }
}

/**
 * 템플릿 파일을 로드하고 캐싱합니다.
 * @param templateName 템플릿 파일명 (확장자 제외)
 * @returns 템플릿 문자열
 * @throws Error 템플릿 파일을 읽을 수 없는 경우
 */
async function loadTemplate(templateName: string): Promise<string> {
  // 템플릿 이름 검증
  validateTemplateName(templateName);

  // 캐시에 있으면 반환
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  try {
    const templatePath = path.join(templateDir, `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf-8');

    // CSS 파일 읽기
    if (template.includes('{{CSS}}')) {
      const cssPath = path.join(templateDir, `${templateName}.css`);
      try {
        const css = await fs.readFile(cssPath, 'utf-8');
        template = template.replace('{{CSS}}', css);
      } catch {
        // CSS 파일이 없어도 템플릿은 렌더링 가능하므로 빈 문자열로 대체
        template = template.replace('{{CSS}}', '');
      }
    }

    // 캐시에 저장
    templateCache.set(templateName, template);

    return template;
  } catch (error) {
    throw new Error(
      `Failed to load template "${templateName}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 템플릿 파일을 읽고 변수를 치환합니다.
 * 템플릿은 메모리에 캐싱되어 성능이 최적화됩니다.
 * @param templateName 템플릿 파일명 (확장자 제외)
 * @param variables 치환할 변수 객체
 * @returns 치환된 템플릿 문자열
 * @throws Error 템플릿을 렌더링할 수 없는 경우
 */
export async function renderTemplate(
  templateName: string,
  variables: Record<string, string>,
): Promise<string> {
  try {
    // 템플릿 로드 (캐시에서 가져오거나 파일에서 읽기)
    let template = await loadTemplate(templateName);

    // 변수 치환 (ReDoS 방지를 위해 정규식 대신 문자열 치환 사용)
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const replacement = value ?? '';
      // 모든 발생을 치환하기 위해 반복 (replace는 첫 번째만 치환)
      while (template.includes(placeholder)) {
        template = template.replace(placeholder, replacement);
      }
    });

    return template;
  } catch (error) {
    throw new Error(
      `Failed to render template "${templateName}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 애플리케이션 시작 시 템플릿을 미리 로드하여 캐싱합니다.
 * @param templateNames 로드할 템플릿 이름 배열
 */
export async function preloadTemplates(templateNames: string[]): Promise<void> {
  await Promise.all(
    templateNames.map((name) =>
      loadTemplate(name).catch((error) => {
        console.warn(`Failed to preload template: ${name}`, error);
      }),
    ),
  );
}
