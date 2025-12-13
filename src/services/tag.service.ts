import { prisma } from '@/config/database';
import { generateUniqueSlug } from '@/utils/slug';
import { NotFoundError, ValidationError } from '@/types';

export class TagService {
  static async getAllTags(sort: 'popular' | 'alphabetical' = 'popular', search?: string) {
    const where: any = search
      ? {
          OR: [{ name: { contains: search, mode: 'insensitive' } }],
        }
      : {};

    const orderBy: any = sort === 'popular' ? { postCount: 'desc' } : { name: 'asc' };

    const tags = await prisma.tag.findMany({
      where,
      orderBy,
    });

    return tags;
  }

  static async getTagBySlug(slug: string) {
    const tag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (!tag) {
      throw new NotFoundError('Tag não encontrada');
    }

    return tag;
  }

  static async createTag(data: { name: string; description?: string }) {
    // Check if tag with same name exists
    const existing = await prisma.tag.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ValidationError('Tag com este nome já existe');
    }

    const slug = await generateUniqueSlug(data.name, 'tag');

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
      },
    });

    return tag;
  }

  static async updateTag(id: string, data: { name?: string; description?: string }) {
    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundError('Tag não encontrada');
    }

    // If name is being updated, check uniqueness and regenerate slug
    let slug = tag.slug;
    if (data.name && data.name !== tag.name) {
      const existing = await prisma.tag.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new ValidationError('Tag com este nome já existe');
      }

      slug = await generateUniqueSlug(data.name, 'tag');
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.name ? slug : undefined,
        description: data.description,
      },
    });

    return updated;
  }

  static async deleteTag(id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundError('Tag não encontrada');
    }

    if (tag._count.posts > 0) {
      throw new ValidationError('Não é possível eliminar tag com posts associados');
    }

    await prisma.tag.delete({
      where: { id },
    });
  }
}

