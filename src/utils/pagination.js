const pageMeta = (total, page, limit) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 15, 1), 100);
  const requestedPage = Math.max(Number(page) || 1, 1);
  const totalCount = Number(total) || 0;
  const totalPages = Math.max(Math.ceil(totalCount / safeLimit), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  return {
    safeLimit,
    currentPage,
    totalPages,
    offset: (currentPage - 1) * safeLimit,
  };
};

const pagedResult = (rows, stats, page, limit) => {
  const { safeLimit, currentPage, totalPages } = pageMeta(stats.total, page, limit);
  return {
    data: rows,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total: Number(stats.total) || 0,
      totalPages,
    },
    stats,
  };
};

const parseListQuery = (query) => {
  const paginated = query.page !== undefined || query.limit !== undefined;
  return {
    paginated,
    page: paginated ? query.page : null,
    limit: paginated ? query.limit : null,
    search: String(query.search || '').trim(),
  };
};

const sendList = (res, result, paginated) => {
  if (paginated) {
    res.json({ success: true, ...result });
    return;
  }
  res.json({ success: true, data: result });
};

const runPagedFind = async ({
  pool,
  selectSql,
  fromSql,
  whereSql,
  params,
  orderSql,
  statsSql,
  page,
  limit,
}) => {
  const paginated = page !== null || limit !== null;
  const fromWhere = `${fromSql} WHERE ${whereSql}`;

  if (!paginated) {
    const { rows } = await pool.query(
      `${selectSql} ${fromWhere} ORDER BY ${orderSql}`,
      params
    );
    return rows;
  }

  const countResult = await pool.query(
    `SELECT ${statsSql} ${fromWhere}`,
    params
  );
  const stats = countResult.rows[0];
  const { safeLimit, currentPage, totalPages, offset } = pageMeta(stats.total, page, limit);
  const { rows } = await pool.query(
    `${selectSql} ${fromWhere} ORDER BY ${orderSql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  return {
    data: rows,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total: Number(stats.total) || 0,
      totalPages,
    },
    stats,
  };
};

module.exports = {
  pageMeta,
  pagedResult,
  parseListQuery,
  sendList,
  runPagedFind,
};
