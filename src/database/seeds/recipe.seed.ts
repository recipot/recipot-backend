import { DataSource } from 'typeorm';
import { Recipe } from '../entity/recipe.entity';
import { Ingredient } from '../entity/ingredient.entity';
import { Seasoning } from '../entity/seasoning.entity';
import { Tool } from '../entity/tool.entity';
import { RecipeImage } from '../entity/recipe-image.entity';
import { RecipeIngredient } from '../entity/recipe-ingredient.entity';
import { RecipeSeasoning } from '../entity/recipe-seasoning.entity';
import { RecipeTool } from '../entity/recipe-tool.entity';
import { RecipeStep } from '../entity/recipe-step.entity';
import { RecipeHealthPoint } from '../entity/recipe-health-point.entity';

export class RecipeSeed {
  constructor(private dataSource: DataSource) {}

  public async run(): Promise<void> {
    const recipeRepository = this.dataSource.getRepository(Recipe);
    if ((await recipeRepository.count()) > 0) {
      console.log('Recipe data already exists, skipping seed.');
      return;
    }

    // Get repositories for all related entities
    const ingredientRepository = this.dataSource.getRepository(Ingredient);
    const seasoningRepository = this.dataSource.getRepository(Seasoning);
    const toolRepository = this.dataSource.getRepository(Tool);
    const recipeImageRepository = this.dataSource.getRepository(RecipeImage);
    const recipeIngredientRepository =
      this.dataSource.getRepository(RecipeIngredient);
    const recipeSeasoningRepository =
      this.dataSource.getRepository(RecipeSeasoning);
    const recipeToolRepository = this.dataSource.getRepository(RecipeTool);
    const recipeStepRepository = this.dataSource.getRepository(RecipeStep);
    const recipeHealthPointRepository =
      this.dataSource.getRepository(RecipeHealthPoint);

    // --- Fetch prerequisite data ---
    const ingredients = await ingredientRepository.find();
    const seasonings = await seasoningRepository.find();
    const tools = await toolRepository.find();

    // Create maps for easy ID lookup
    const ingredientMap = new Map(ingredients.map((i) => [i.name, i.id]));
    const seasoningMap = new Map(seasonings.map((s) => [s.name, s.id]));
    const toolMap = new Map(tools.map((t) => [t.name, t.id]));

    // --- Define 10 recipe data objects ---
    const recipesData = [
      // Paste the same 10 recipe objects here, from 김치찌개 to 알리오 올리오
      // 1. 김치찌개
      {
        title: '돼지고기 김치찌개',
        description: '한국인의 소울푸드, 얼큰하고 맛있는 김치찌개입니다.',
        duration: 'R01003', // 30분 이내
        images: [{ imageUrl: 'https://i.imgur.com/kFDU54j.jpeg' }],
        ingredients: [
          {
            name: '김치',
            amount: '300g',
            isAlternative: false,
          },
          { name: '두부', amount: '1/2모', isAlternative: true },
          { name: '양파', amount: '1/4개', isAlternative: true },
        ],
        seasonings: [
          { name: '고춧가루', amount: '1큰술' },
          { name: '다진마늘', amount: '1큰술' },
          { name: '국간장', amount: '1큰술' },
          { name: '물', amount: '500ml' },
        ],
        tools: [{ name: '냄비(원팟)' }, { name: '칼/도마' }],
        steps: [
          {
            orderNum: 1,
            summary: '재료 준비',
            content: '김치, 양파를 먹기 좋게 썰고 두부는 깍둑썰기 합니다.',
            imageUrl: 'https://i.imgur.com/kFDU54j.jpeg',
          },
          {
            orderNum: 2,
            summary: '볶기',
            content: '냄비에 식용유를 두르고 김치를 볶아줍니다.',
            imageUrl: 'https://i.imgur.com/kFDU54j.jpeg',
          },
          {
            orderNum: 3,
            summary: '끓이기',
            content:
              '물을 붓고 끓으면 양파, 두부와 모든 양념을 넣고 10분 더 끓입니다.',
            imageUrl: 'https://i.imgur.com/kFDU54j.jpeg',
          },
        ],
        healthPoints: [{ content: '김치의 유산균이 장 건강에 도움을 줍니다.' }],
      },
      // 2. 된장찌개
      {
        title: '차돌박이 된장찌개',
        description: '구수한 된장과 고소한 차돌박이의 완벽한 조화',
        duration: 'R01003', // 30분 이내
        images: [{ imageUrl: 'https://i.imgur.com/A1O2d6c.jpeg' }],
        ingredients: [
          { name: '두부', amount: '1/2모', isAlternative: false },
          { name: '호박', amount: '1/4개', isAlternative: true },
          { name: '양파', amount: '1/4개', isAlternative: true },
          { name: '버섯', amount: '조금', isAlternative: true },
        ],
        seasonings: [
          { name: '된장', amount: '2큰술' },
          { name: '고추장', amount: '1/2큰술' },
          { name: '다진마늘', amount: '1큰술' },
          { name: '물', amount: '400ml' },
        ],
        tools: [{ name: '냄비(원팟)' }, { name: '칼/도마' }],
        steps: [
          {
            orderNum: 1,
            summary: '재료 손질',
            content: '모든 채소와 두부를 깍둑썰기 합니다.',
            imageUrl: 'https://i.imgur.com/A1O2d6c.jpeg',
          },
          {
            orderNum: 2,
            summary: '된장 풀기',
            content: '냄비에 물과 된장, 고추장을 풀어 끓입니다.',
            imageUrl: 'https://i.imgur.com/A1O2d6c.jpeg',
          },
          {
            orderNum: 3,
            summary: '끓이기',
            content:
              '채소를 넣고 끓이다가 마지막에 두부를 넣고 한소끔 더 끓여 완성합니다.',
            imageUrl: 'https://i.imgur.com/A1O2d6c.jpeg',
          },
        ],
        healthPoints: [
          { content: '된장의 이소플라본은 항암 효과가 있습니다.' },
        ],
      },
      // 3. 고등어 구이
      {
        title: '에어프라이어 고등어 구이',
        description: '냄새 걱정 없이 간편하게 만드는 담백한 고등어 구이',
        duration: 'R01002', // 20분 이내
        images: [{ imageUrl: 'https://i.imgur.com/4l8dJmN.jpeg' }],
        ingredients: [
          { name: '고등어', amount: '1마리', isAlternative: false },
        ],
        seasonings: [
          { name: '소금', amount: '조금' },
          { name: '후춧가루', amount: '조금' },
          { name: '식용유', amount: '1큰술' },
        ],
        tools: [{ name: '에어프라이어' }],
        steps: [
          {
            orderNum: 1,
            summary: '밑간하기',
            content: '고등어에 소금과 후추로 밑간을 합니다.',
            imageUrl: 'https://i.imgur.com/4l8dJmN.jpeg',
          },
          {
            orderNum: 2,
            summary: '굽기',
            content:
              '에어프라이어에 종이 호일을 깔고 고등어를 올린 뒤 180도에서 15분, 뒤집어서 10분 더 굽습니다.',
            imageUrl: 'https://i.imgur.com/4l8dJmN.jpeg',
          },
        ],
        healthPoints: [
          { content: '고등어의 오메가-3는 두뇌 발달과 혈관 건강에 좋습니다.' },
        ],
      },
      // 4. 김치볶음밥
      {
        title: '클래식 김치볶음밥',
        description: '누구나 좋아하는 기본에 충실한 김치볶음밥',
        duration: 'R01002', // 20분 이내
        images: [{ imageUrl: 'https://i.imgur.com/jgw82P3.jpeg' }],
        ingredients: [
          { name: '백미', amount: '1공기', isAlternative: false },
          { name: '김치', amount: '1/4포기', isAlternative: false },
        ],
        seasonings: [
          { name: '고추장', amount: '1큰술' },
          { name: '설탕', amount: '0.5큰술' },
          { name: '참기름', amount: '1큰술' },
        ],
        tools: [{ name: '프라이팬(원팬)' }, { name: '칼/도마' }],
        steps: [
          {
            orderNum: 1,
            summary: '김치 썰기',
            content: '김치를 잘게 썰어 준비합니다.',
            imageUrl: 'https://i.imgur.com/jgw82P3.jpeg',
          },
          {
            orderNum: 2,
            summary: '볶기',
            content:
              '팬에 기름을 두르고 김치를 볶다가 밥과 양념을 넣고 함께 볶습니다.',
            imageUrl: 'https://i.imgur.com/jgw82P3.jpeg',
          },
          {
            orderNum: 3,
            summary: '마무리',
            content:
              '마지막에 참기름을 두르고 가볍게 섞어줍니다. 계란 후라이를 올리면 더 맛있습니다.',
            imageUrl: 'https://i.imgur.com/jgw82P3.jpeg',
          },
        ],
        healthPoints: [],
      },
      // 5. 감자전
      {
        title: '바삭한 감자전',
        description: '겉은 바삭, 속은 쫀득! 막걸리를 부르는 감자전',
        duration: 'R01003', // 30분 이내
        images: [{ imageUrl: 'https://i.imgur.com/h9d8f2S.jpeg' }],
        ingredients: [
          { name: '감자', amount: '3개', isAlternative: false },
          { name: '전분', amount: '2큰술', isAlternative: false },
        ],
        seasonings: [
          { name: '소금', amount: '1/2작은술' },
          { name: '식용유', amount: '넉넉히' },
        ],
        tools: [{ name: '프라이팬(원팬)' }, { name: '칼/도마' }],
        steps: [
          {
            orderNum: 1,
            summary: '감자 갈기',
            content: '감자를 강판에 갈아줍니다. 믹서기를 사용해도 좋습니다.',
            imageUrl: 'https://i.imgur.com/h9d8f2S.jpeg',
          },
          {
            orderNum: 2,
            summary: '반죽하기',
            content: '간 감자에 전분과 소금을 넣고 섞어 반죽을 만듭니다.',
            imageUrl: 'https://i.imgur.com/h9d8f2S.jpeg',
          },
          {
            orderNum: 3,
            summary: '부치기',
            content:
              '기름을 넉넉히 두른 팬에 반죽을 얇게 펴고 앞뒤로 노릇하게 부쳐냅니다.',
            imageUrl: 'https://i.imgur.com/h9d8f2S.jpeg',
          },
        ],
        healthPoints: [],
      },
      // 6. 참치마요 덮밥
      {
        title: '초간단 참치마요 덮밥',
        description: '자취생 필수 레시피! 10분 완성 참치마요 덮밥',
        duration: 'R01001', // 10분 이내
        images: [{ imageUrl: 'https://i.imgur.com/tT4fE8t.jpeg' }],
        ingredients: [
          { name: '백미', amount: '1공기', isAlternative: false },
          { name: '참치', amount: '1캔', isAlternative: false },
          { name: '마요네즈', amount: '3큰술', isAlternative: false },
        ],
        seasonings: [
          { name: '간장', amount: '1큰술' },
          { name: '설탕', amount: '0.5큰술' },
          { name: '후춧가루', amount: '조금' },
        ],
        tools: [],
        steps: [
          {
            orderNum: 1,
            summary: '참치 준비',
            content: '참치는 기름을 빼고 마요네즈와 다른 양념들과 섞어줍니다.',
            imageUrl: 'https://i.imgur.com/tT4fE8t.jpeg',
          },
          {
            orderNum: 2,
            summary: '올리기',
            content: '따뜻한 밥 위에 준비한 참치마요를 듬뿍 올려줍니다.',
            imageUrl: 'https://i.imgur.com/tT4fE8t.jpeg',
          },
        ],
        healthPoints: [],
      },
      // 7. 떡볶이
      {
        title: '학교 앞 추억의 떡볶이',
        description: '달콤하고 매콤한, 옛날 학교 앞에서 먹던 바로 그 맛!',
        duration: 'R01002', // 20분 이내
        images: [{ imageUrl: 'https://i.imgur.com/oB4dY6c.jpeg' }],
        ingredients: [
          { name: '밀떡', amount: '300g', isAlternative: true },
          { name: '어묵', amount: '2장', isAlternative: true },
        ],
        seasonings: [
          { name: '고추장', amount: '3큰술' },
          { name: '설탕', amount: '2큰술' },
          { name: '간장', amount: '1큰술' },
          { name: '다진마늘', amount: '0.5큰술' },
          { name: '물', amount: '400ml' },
        ],
        tools: [{ name: '프라이팬(멀티팬)' }],
        steps: [
          {
            orderNum: 1,
            summary: '육수내기',
            content: '물에 양념을 모두 넣고 끓여줍니다.',
            imageUrl: 'https://i.imgur.com/oB4dY6c.jpeg',
          },
          {
            orderNum: 2,
            summary: '끓이기',
            content:
              '육수가 끓으면 떡과 어묵을 넣고 떡이 말랑해질 때까지 끓입니다.',
            imageUrl: 'https://i.imgur.com/oB4dY6c.jpeg',
          },
        ],
        healthPoints: [],
      },
      // 8. 어묵탕
      {
        title: '시원한 어묵탕',
        description: '쌀쌀한 날 생각나는 뜨끈하고 시원한 국물의 어묵탕',
        duration: 'R01002', // 20분 이내
        images: [{ imageUrl: 'https://i.imgur.com/sJ5gX2e.jpeg' }],
        ingredients: [
          { name: '어묵', amount: '300g', isAlternative: false },
          { name: '무', amount: '1/5개', isAlternative: true },
        ],
        seasonings: [
          { name: '국간장', amount: '2큰술' },
          { name: '소금', amount: '조금' },
          { name: '다진마늘', amount: '0.5큰술' },
          { name: '물', amount: '800ml' },
        ],
        tools: [{ name: '냄비(원팟)' }],
        steps: [
          {
            orderNum: 1,
            summary: '육수내기',
            content: '물에 무를 넣고 끓여 시원한 맛을 우려냅니다.',
            imageUrl: 'https://i.imgur.com/sJ5gX2e.jpeg',
          },
          {
            orderNum: 2,
            summary: '끓이기',
            content:
              '무가 투명해지면 어묵과 나머지 양념을 넣고 5분간 더 끓입니다.',
            imageUrl: 'https://i.imgur.com/sJ5gX2e.jpeg',
          },
        ],
        healthPoints: [],
      },
      // 9. 토마토 스파게티
      {
        title: '기본 토마토 스파게티',
        description: '시판 소스로 간단하게 만드는 클래식 토마토 스파게티',
        duration: 'R01002', // 20분 이내
        images: [{ imageUrl: 'https://i.imgur.com/Y7aLp2p.jpeg' }],
        ingredients: [
          { name: '파스타', amount: '1인분', isAlternative: false },
          {
            name: '스파게티 소스',
            amount: '150g',
            isAlternative: false,
          },
          { name: '양파', amount: '1/4개', isAlternative: true },
        ],
        seasonings: [
          { name: '소금', amount: '조금' },
          { name: '후춧가루', amount: '조금' },
          { name: '올리브유', amount: '1큰술' },
        ],
        tools: [{ name: '냄비(멀티팟)' }],
        steps: [
          {
            orderNum: 1,
            summary: '면 삶기',
            content: '끓는 물에 소금을 넣고 파스타 면을 삶아줍니다.',
            imageUrl: 'https://i.imgur.com/Y7aLp2p.jpeg',
          },
          {
            orderNum: 2,
            summary: '소스 끓이기',
            content:
              '팬에 올리브유를 두르고 양파를 볶다가 토마토 소스를 넣고 끓입니다.',
            imageUrl: 'https://i.imgur.com/Y7aLp2p.jpeg',
          },
          {
            orderNum: 3,
            summary: '섞기',
            content: '삶은 면을 소스에 넣고 잘 섞어줍니다.',
            imageUrl: 'https://i.imgur.com/Y7aLp2p.jpeg',
          },
        ],
        healthPoints: [],
      },
      // 10. 알리오 올리오
      {
        title: '알리오 올리오 파스타',
        description: '마늘과 올리브유의 풍미가 가득한 기본 오일 파스타',
        duration: 'R01002', // 20분 이내
        images: [{ imageUrl: 'https://i.imgur.com/5gXyZ8R.jpeg' }],
        ingredients: [
          { name: '파스타', amount: '1인분', isAlternative: false },
        ],
        seasonings: [
          { name: '올리브유', amount: '4큰술' },
          { name: '다진마늘', amount: '2큰술' },
          { name: '소금', amount: '조금' },
          { name: '후춧가루', amount: '조금' },
        ],
        tools: [{ name: '냄비(멀티팟)' }],
        steps: [
          {
            orderNum: 1,
            summary: '면 삶기',
            content:
              '끓는 물에 소금을 넣고 파스타 면을 삶아줍니다. 면수는 버리지 마세요.',
            imageUrl: 'https://i.imgur.com/5gXyZ8R.jpeg',
          },
          {
            orderNum: 2,
            summary: '마늘 볶기',
            content:
              '팬에 올리브유를 두르고 약불에서 마늘을 천천히 볶아 향을 냅니다.',
            imageUrl: 'https://i.imgur.com/5gXyZ8R.jpeg',
          },
          {
            orderNum: 3,
            summary: '섞기',
            content:
              '삶은 면과 면수 2큰술을 팬에 넣고 빠르게 섞어 유화시킵니다. 소금, 후추로 간을 맞춥니다.',
            imageUrl: 'https://i.imgur.com/5gXyZ8R.jpeg',
          },
        ],
        healthPoints: [],
      },
    ];

    for (const data of recipesData) {
      // 1. Save Recipe
      const recipe = recipeRepository.create({
        title: data.title,
        description: data.description,
        duration: data.duration,
      });
      const savedRecipe = await recipeRepository.save(recipe);

      // 2. Save RecipeImages
      if (data.images && data.images.length > 0) {
        const images = data.images.map((img) =>
          recipeImageRepository.create({
            ...img,
            recipeId: savedRecipe.id,
          }),
        );
        await recipeImageRepository.save(images);
      }

      // 3. Save RecipeIngredients
      if (data.ingredients && data.ingredients.length > 0) {
        const ingredients = data.ingredients.map((ing) =>
          recipeIngredientRepository.create({
            ...ing,
            ingredientId: ingredientMap.get(ing.name),
            recipeId: savedRecipe.id,
          }),
        );
        await recipeIngredientRepository.save(ingredients);
      }

      // 4. Save RecipeSeasonings
      if (data.seasonings && data.seasonings.length > 0) {
        const seasonings = data.seasonings.map((s) =>
          recipeSeasoningRepository.create({
            ...s,
            seasoningId: seasoningMap.get(s.name),
            recipeId: savedRecipe.id,
          }),
        );
        await recipeSeasoningRepository.save(seasonings);
      }

      // 5. Save RecipeTools
      if (data.tools && data.tools.length > 0) {
        const tools = data.tools.map((t) =>
          recipeToolRepository.create({
            toolId: toolMap.get(t.name),
            recipeId: savedRecipe.id,
          }),
        );
        await recipeToolRepository.save(tools);
      }

      // 6. Save RecipeSteps
      if (data.steps && data.steps.length > 0) {
        const steps = data.steps.map((step) =>
          recipeStepRepository.create({
            ...step,
            recipeId: savedRecipe.id,
          }),
        );
        await recipeStepRepository.save(steps);
      }

      // 7. Save RecipeHealthPoints
      if (data.healthPoints && data.healthPoints.length > 0) {
        const healthPoints = data.healthPoints.map((hp) =>
          recipeHealthPointRepository.create({
            ...hp,
            recipeId: savedRecipe.id,
          }),
        );
        await recipeHealthPointRepository.save(healthPoints);
      }
    }

    console.log('RecipeSeed executed successfully');
  }
}
