const parseError = async (error) => {
  if (error.errors) {
    let message = Object.entries(error.errors)
      .map((e) => {
        return new String(e[1].properties.message).replace('Error, ', '');
      })
      .join(',');

    return message;
  }
  return undefined;
};

const parseQueryParams = async (query) => {
  let parsedQuery = {};
  for (const entry of Object.entries(query)) {
    const [key, value] = entry;
    if (typeof value == 'string') {
      if (value == 'true') {
        parsedQuery[key] = true;
      } else if (value == 'false') {
        parsedQuery[key] = false;
      } else if (typeof Number(value) == 'number' && !isNaN(Number(value))) {
        if (value.length < 17) {
          parsedQuery[key] = Number(value);
        }
      } else if (value == 'null') {
        parsedQuery[key] = null;
      } else if (value == 'undefined') {
        parsedQuery[key] = undefined;
      } else {
        parsedQuery[key] = value;
      }
    }
  }
  return { ...query, ...parsedQuery };
};

const extractIPAndUserAgent = async (req) => {
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let userAgent = req.headers['user-agent'];
  return { ip, userAgent };
};

const parseCookies = async (cookies) => {
  let cookieObj = {};
  if (cookies) {
    let cookieArr = cookies.split(';');
    for (const cookie of cookieArr) {
      let [key, value] = cookie.split('=');
      if (key && value) {
        cookieObj[key.trim()] = value.trim();
      }
    }
  }
  return cookieObj;
};

module.exports = {
  parseQueryParams,
  extractIPAndUserAgent,
  parseError,
  parseCookies,
};
