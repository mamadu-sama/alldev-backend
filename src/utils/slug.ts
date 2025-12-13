import { prisma } from '@/config/database';

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

export const generateUniqueSlug = async (
  title: string,
  model: 'post' | 'tag' = 'post'
): Promise<string> => {
  let slug = slugify(title);
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const existing =
      model === 'post'
        ? await prisma.post.findUnique({ where: { slug } })
        : await prisma.tag.findUnique({ where: { slug } });

    if (!existing) {
      isUnique = true;
    } else {
      slug = `${slugify(title)}-${counter}`;
      counter++;
    }
  }

  return slug;
};

