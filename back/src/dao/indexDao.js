const { pool } = require("../../config/database");

// 회원가입
exports.insertUsers = async function (connection, userID, password, nickname) {
  const Query = `insert into FoodMap.Users(userID, password, nickname) values (?,?,?);`;
  const Params = [userID, password, nickname];

  const rows = await connection.query(Query, Params);

  return rows;
};

// 아이디 중복검사
exports.checkUserID = async function (connection, userID) {
  const Query = `SELECT userID FROM FoodMap.Users WHERE userID = ?;`;
  const Params = [userID];

  const rows = await connection.query(Query, Params);

  return rows;
};

// 로그인 (회원검증)
exports.isValidUsers = async function (connection, userID, password) {
  const Query = `SELECT userIdx, nickname FROM Users where userID = ? and password = ? and status = 'A';`;
  const Params = [userID, password];

  const rows = await connection.query(Query, Params);

  return rows;
};


exports.selectRestaurants = async function (connection, category) {
  const selectAllRestaurantsQuery = `SELECT title, address, category, videoUrl FROM FoodMap.Restaurants where status = 'A';`;
  const selectCategorizedRestaurantsQuery = `SELECT title, address, category, videoUrl FROM FoodMap.Restaurants where status = 'A' and category = ?;`;
  
  const Params = [category];

  const Query = category
  ? selectCategorizedRestaurantsQuery
  : selectAllRestaurantsQuery;   

  const rows = await connection.query(Query, Params);

  return rows;
};

