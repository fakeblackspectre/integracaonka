
const Routes = require('./routes')

require("dotenv-safe").config();

const server = http.createServer(app); 
const PORT = process.env.PORT || 3000;
server.listen(PORT);

app.use(express.json());

app.use('', Routes)

