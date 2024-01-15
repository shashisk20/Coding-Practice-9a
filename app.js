const express = require('express')
const bcrypt = require('bcrypt')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')
let db = null

const initialise = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(e)
  }
}

initialise()

// API 1: Register
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const createUserQuery = `
                INSERT INTO user 
                    (username, name, password, gender, location)
                VALUES
                    (
                        "${username}",
                        "${name}",
                        "${encryptedPwd}",
                        "${gender}",
                        "${location}"
                    );
            `

  const userExists = async username => {
    let user = await db.get(
      `SELECT * FROM user WHERE username = "${username}";`,
    )
    if (user === undefined) {
      return false
    } else {
      return true
    }
  }
  const validpwd = password => {
    if (password.length >= 5) {
      return true
    } else {
      return false
    }
  }

  if (userExists(username)) {
    response.status(400).send('User already exists')
  } else {
    if (validpwd(password)) {
      // Create User
      const encryptedPwd = await bcrypt.hash(password, 10)
      const createUserQuery = `
        INSERT INTO user 
          (username, name, password, gender, location)
        VALUES
          (?, ?, ?, ?, ?);
      `
      db.run(createUserQuery, [username, name, encryptedPwd, gender, location])
      response.status(200).send('User created successfully')
    } else {
      response.status(400).send('Password is too short')
    }
  }
})

// API 2:
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const getUserQuery = `
    SELECT 
      *
    FROM
      user
    WHERE username = ?;
  `
  try {
    const user = await db.get(getUserQuery, [username])
    if (user === undefined) {
      response.status(400).send('Invalid user')
    } else {
      const isPwdMatch = await bcrypt.compare(password, user.password)
      if (isPwdMatch) {
        response.status(200).send('Login success!')
      } else {
        response.status(400).send('Invalid password')
      }
    }
  } catch (error) {
    console.error(error)
    response.status(500).send('Internal Server Error')
  }
})

module.exports = app
