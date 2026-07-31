export const parseQuery = (query: any) => {
  const { page, limit, sort, ...filters } = query;

  const filterObj: Record<string, any> = {};
  for (const key of Object.keys(filters)) {
    if (filters[key] !== undefined && filters[key] !== '') {
      if (filters[key] === 'true') {
        filterObj[key] = true;
      } else if (filters[key] === 'false') {
        filterObj[key] = false;
      } else {
        filterObj[key] = filters[key];
      }
    }
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  
  let sortObj = {};
  if (sort) {
    const sortParts = (sort as string).split(',');
    sortParts.forEach((part) => {
      const isDesc = part.startsWith('-');
      const field = isDesc ? part.substring(1) : part;
      (sortObj as any)[field] = isDesc ? -1 : 1;
    });
  } else {
    sortObj = { createdAt: -1 };
  }

  return { filterObj, pageNum, limitNum, sortObj };
};
