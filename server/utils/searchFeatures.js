class SearchFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    search() {
        const keyword = this.queryString.keyword
            ? {
                  name: {
                      $regex: this.queryString.keyword,
                      $options: 'i',
                  },
              }
            : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        // Whitelist of allowed filter fields to prevent NoSQL injection
        const ALLOWED_FIELDS = ['category', 'brand', 'warranty', 'ratings'];
        const ALLOWED_OPERATORS = ['gt', 'gte', 'lt', 'lte'];

        const sanitized = {};

        for (const key of ALLOWED_FIELDS) {
            if (this.queryString[key] !== undefined) {
                sanitized[key] = this.queryString[key];
            }
        }

        // Handle price range operators safely
        if (this.queryString.price) {
            const price = this.queryString.price;
            sanitized.price = {};
            for (const op of ALLOWED_OPERATORS) {
                if (price[op] !== undefined) {
                    const val = Number(price[op]);
                    if (!isNaN(val)) {
                        sanitized.price[`$${op}`] = val;
                    }
                }
            }
            if (Object.keys(sanitized.price).length === 0) {
                delete sanitized.price;
            }
        }

        this.query = this.query.find(sanitized);
        return this;
    }

    pagination(resultPerPage) {
        const currentPage = Number(this.queryString.page) || 1;
        const skipProducts = resultPerPage * (currentPage - 1);
        this.query = this.query.limit(resultPerPage).skip(skipProducts);
        return this;
    }
}

module.exports = SearchFeatures;
