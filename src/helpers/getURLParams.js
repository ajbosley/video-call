const getURLParams = (locationString) => {
  try {
    const hashes = locationString
      .slice(locationString.indexOf("?") + 1)
      .split("&");
    const params = {};
    hashes.map((hash) => {
      const match = hash.match(/([^=]+?)=(.+)/);
      const key = match[1];
      const val = match[2];
      params[key] = decodeURIComponent(val);
    });
    return params;
  } catch (error) {
    return { error: "Error fetching url params" };
  }
};

export default getURLParams;
