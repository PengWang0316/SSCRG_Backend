CREATE TABLE IF NOT EXISTS Comments (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message TEXT,
  userId VARCHAR(255) NOT NULL,
  postId INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY FK (userId, postId)
);
ALTER TABLE `Comments` ADD INDEX `comments_postId_userId_timestamp` (postId, userId, timestamp);

CREATE TABLE IF NOT EXISTS Posts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message text,
  userId VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY FK (userId)
);
ALTER TABLE `Posts` ADD INDEX `posts_userId_timestamp` (userId, timestamp);

CREATE TABLE IF NOT EXISTS Users (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  displayName VARCHAR(255)
);

/* Testing
INSERT INTO Users (id, displayName) VALUES ('1', 'user1');
INSERT INTO Users (id, displayName) VALUES ('2', 'user2');
INSERT INTO Users (id, displayName) VALUES ('3', 'user3');
INSERT INTO Users (id, displayName) VALUES ('4', 'user4');
INSERT INTO Users (id, displayName) VALUES ('5', 'user5');
INSERT INTO Users (id, displayName) VALUES ('6', 'user6');
INSERT INTO Users (id, displayName) VALUES ('7', 'user7');


EXPLAIN SELECT p.message, p.timestamp, u.displayName FROM Posts AS p INNER JOIN Users AS u ON p.userId = u.id ORDER BY p.timestamp DESC; */