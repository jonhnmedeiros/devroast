import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";
import { db } from "./index";
import { roastDiffs, roastIssues, roasts } from "./schema";

// ---------------------------------------------------------------------------
// Pools de dados — cada roast é montado combinando elementos desses pools
// ---------------------------------------------------------------------------

type Severity = "critical" | "warning" | "good";
type DiffType = "added" | "removed" | "context";

const LANGUAGES = [
	"javascript",
	"typescript",
	"python",
	"java",
	"sql",
	"go",
	"rust",
	"php",
	"ruby",
	"csharp",
] as const;

const VERDICTS = [
	"absolute_disaster",
	"mass_destruction",
	"career_ending",
	"needs_serious_help",
	"logically_challenged",
	"security_nightmare",
	"willfully_negligent",
	"cpu_arsonist",
	"barely_functional",
	"surprisingly_mediocre",
	"could_be_worse",
	"almost_acceptable",
	"not_terrible",
	"decent_attempt",
	"respectable_effort",
];

const QUOTES = [
	"this code looks like it was written during a power outage... in 2005.",
	"congratulations, you just built the world's most efficient security vulnerability generator.",
	"i've seen better code written by a cat walking across a keyboard.",
	"this is what happens when you copy from stack overflow with your eyes closed.",
	"your code is the reason we have code reviews.",
	"this code has more red flags than a communist parade.",
	"the only thing consistent about this code is how consistently bad it is.",
	"i'm not sure if this is code or a cry for help.",
	"this makes spaghetti code look like a michelin star dish.",
	"whoever wrote this clearly has a very creative relationship with logic.",
	"i've seen cleaner dumpster fires.",
	"this code violates at least three geneva conventions.",
	"bold move writing code that even a debugger refuses to step through.",
	"at least it compiles... oh wait, it doesn't.",
	"the confidence-to-skill ratio here is astronomical.",
	"this code is so bad it made my linter file a complaint with HR.",
	"you didn't just reinvent the wheel — you reinvented the square wheel.",
	"this is the software equivalent of duct-taping a bridge together.",
	"somewhere a computer science professor just felt a disturbance in the force.",
	"this code runs on hopes, dreams, and undefined behavior.",
	"if this code were a building, it would be condemned.",
	"impressive — you found a way to make 3 lines of code unmaintainable.",
	"the comments say 'TODO' but your code says 'TODON'T'.",
	"this function has more side effects than an experimental drug.",
	"the good news: it works. the bad news: nobody knows why.",
	"your variable names read like a password generator gone wrong.",
	"this code is held together by the programming equivalent of chewing gum.",
	"i see you went with the 'write once, understand never' philosophy.",
	"the only test this code would pass is a test of patience.",
	"this makes me want to mass-revert and start from scratch.",
];

// Pool de issues por severity, reutilizáveis entre roasts
const ISSUE_POOL: Array<{
	severity: Severity;
	title: string;
	description: string;
}> = [
	// critical
	{
		severity: "critical",
		title: "using var instead of const/let",
		description:
			"var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
	},
	{
		severity: "critical",
		title: "eval() with user input",
		description:
			"eval() executes arbitrary code from user input. this is the textbook definition of a code injection vulnerability.",
	},
	{
		severity: "critical",
		title: "SQL injection vulnerability",
		description:
			"string concatenation in SQL queries is a direct invitation for injection attacks. use parameterized queries.",
	},
	{
		severity: "critical",
		title: "hardcoded credentials",
		description:
			"passwords and API keys in source code will end up in version control. use environment variables.",
	},
	{
		severity: "critical",
		title: "swallowed exception",
		description:
			"silently catching and ignoring exceptions hides bugs and makes debugging impossible. at minimum, log the error.",
	},
	{
		severity: "critical",
		title: "infinite loop risk",
		description:
			"the loop termination condition is unreliable. this will hang the process under certain inputs.",
	},
	{
		severity: "critical",
		title: "memory leak detected",
		description:
			"event listeners are registered but never removed. over time this will consume all available memory.",
	},
	{
		severity: "critical",
		title: "race condition",
		description:
			"shared mutable state accessed from multiple async operations without synchronization. data corruption is inevitable.",
	},
	{
		severity: "critical",
		title: "no input validation",
		description:
			"user input is passed directly to sensitive operations. any malicious input will be blindly executed.",
	},
	{
		severity: "critical",
		title: "prototype pollution",
		description:
			"merging user-controlled objects into prototypes allows attackers to inject properties into all objects.",
	},
	{
		severity: "critical",
		title: "unhandled promise rejection",
		description:
			"async errors are silently dropped. in production this crashes the process with no useful stack trace.",
	},
	{
		severity: "critical",
		title: "XSS vulnerability",
		description:
			"user content is rendered as raw HTML without sanitization. any script tag will execute in users' browsers.",
	},

	// warning
	{
		severity: "warning",
		title: "imperative loop pattern",
		description:
			"for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
	},
	{
		severity: "warning",
		title: "magic numbers everywhere",
		description:
			"numeric literals scattered through the code with no explanation. extract them into named constants.",
	},
	{
		severity: "warning",
		title: "deeply nested conditionals",
		description:
			"4+ levels of nesting make the code unreadable. use early returns or extract helper functions.",
	},
	{
		severity: "warning",
		title: "god function detected",
		description:
			"this function does 7 different things. break it down into smaller, focused functions.",
	},
	{
		severity: "warning",
		title: "inconsistent error handling",
		description:
			"some paths throw, others return null, others log and continue. pick one strategy and apply it consistently.",
	},
	{
		severity: "warning",
		title: "no type safety",
		description:
			"using 'any' everywhere defeats the purpose of typescript. add proper types to catch bugs at compile time.",
	},
	{
		severity: "warning",
		title: "synchronous file I/O",
		description:
			"readFileSync blocks the event loop. use the async version to avoid freezing the entire application.",
	},
	{
		severity: "warning",
		title: "missing error boundary",
		description:
			"if this component throws, the entire page crashes. wrap it in an error boundary for graceful degradation.",
	},
	{
		severity: "warning",
		title: "unused variables",
		description:
			"multiple declared variables are never read. this clutters the code and confuses future readers.",
	},
	{
		severity: "warning",
		title: "string concatenation in loops",
		description:
			"building strings with += in a loop creates O(n²) allocations. use an array and join at the end.",
	},
	{
		severity: "warning",
		title: "copy-paste duplication",
		description:
			"the same logic appears in 3 places. extract it into a shared function to follow DRY.",
	},
	{
		severity: "warning",
		title: "loose equality operator",
		description:
			"== performs type coercion. use === for strict comparison to avoid subtle bugs.",
	},

	// good
	{
		severity: "good",
		title: "clear naming conventions",
		description:
			"variable and function names are descriptive and self-documenting. this is rare and appreciated.",
	},
	{
		severity: "good",
		title: "single responsibility",
		description:
			"the function does one thing well. no side effects, no mixed concerns, no hidden complexity.",
	},
	{
		severity: "good",
		title: "proper error handling",
		description:
			"errors are caught, logged, and propagated correctly. the calling code can make informed decisions.",
	},
	{
		severity: "good",
		title: "consistent formatting",
		description:
			"the code style is consistent throughout. braces, spacing, and indentation follow a clear convention.",
	},
	{
		severity: "good",
		title: "good use of types",
		description:
			"types are specific and meaningful. they document the contract and catch errors before runtime.",
	},
	{
		severity: "good",
		title: "defensive programming",
		description:
			"null checks and boundary validation are in place. the code handles edge cases gracefully.",
	},
	{
		severity: "good",
		title: "readable control flow",
		description:
			"early returns and guard clauses keep the happy path at the top level. easy to follow.",
	},
	{
		severity: "good",
		title: "immutable data patterns",
		description:
			"data is never mutated in place. new objects are created for each transformation, preventing side effects.",
	},
];

// Snippets de código por linguagem — cada um é uma amostra realista de "código ruim"
const CODE_SNIPPETS: Record<string, string[]> = {
	javascript: [
		`function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }
  return total;
}`,
		`eval(prompt("enter code"))
document.write(response)
// trust the user lol`,
		`const sleep = (ms) =>
  new Date(Date.now() + ms)
  while(new Date() < end) {}`,
		`function isEven(n) {
  if (n === 0) return true;
  if (n === 1) return false;
  if (n === 2) return true;
  if (n === 3) return false;
  return isEven(n - 2);
}`,
		`const fetchData = () => {
  fetch('/api/users')
    .then(r => r.json())
    .then(data => {
      document.innerHTML = data.map(u =>
        '<div>' + u.name + '</div>'
      ).join('')
    })
}`,
		`function sort(arr) {
  for (var i = 0; i < arr.length; i++) {
    for (var j = 0; j < arr.length; j++) {
      if (arr[i] < arr[j]) {
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
    }
  }
  return arr;
}`,
		`let data = null;
setTimeout(() => {
  data = fetchSync('/api/data');
}, 0);
console.log(data.items);`,
		`const cache = {};
function getData(key) {
  if (!cache[key]) {
    cache[key] = fetch('/api/' + key);
  }
  return cache[key];
}
// never clears cache btw`,
		`if (user.role == "admin") {
  showAdminPanel();
} else if (user.role == "Admin") {
  showAdminPanel();
} else if (user.role == "ADMIN") {
  showAdminPanel();
} else {
  showUserPanel();
}`,
		`function validate(email) {
  if (email.includes("@")) {
    if (email.includes(".")) {
      return true;
    }
  }
  return false;
}`,
		`const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
// handles: dates? no. regex? no. functions? no.
// but it works for my use case trust me`,
		`window.onerror = function() {
  return true; // suppress all errors
}`,
		`async function loadAll() {
  const users = await fetch('/api/users').then(r => r.json());
  const posts = await fetch('/api/posts').then(r => r.json());
  const comments = await fetch('/api/comments').then(r => r.json());
  const likes = await fetch('/api/likes').then(r => r.json());
  const tags = await fetch('/api/tags').then(r => r.json());
  return { users, posts, comments, likes, tags };
}`,
	],
	typescript: [
		`if (x == true) { return true; }
else if (x == false) { return false; }
else { return !false; }`,
		`function processData(data: any): any {
  const result: any = {};
  for (const key in data) {
    result[key] = (data as any)[key];
  }
  return result as any;
}`,
		`interface User {
  name: string;
  age: number;
  email: string;
}
const user = {} as User;
// all fields undefined but TS is happy`,
		`type Response = {
  data: any;
  error: any;
  status: any;
  message: any;
  meta: any;
}`,
		`function handleEvent(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value as unknown as number;
  const result = (value as any).toFixed(2) as string;
  return result as unknown as boolean;
}`,
		`// @ts-ignore
const result = dangerousFunction();
// @ts-ignore
result.doSomething();
// @ts-ignore
return result.value;`,
		`export function getUser(id: string): Promise<User | null | undefined | false | 0 | ""> {
  return db.findOne({ id });
}`,
		`const config: Record<string, unknown> = {
  port: "3000" as unknown as number,
  debug: "true" as unknown as boolean,
  timeout: "5000" as unknown as number,
};`,
		`class ApiService {
  private static instance: ApiService;
  private static instance2: ApiService;
  private data: any = {};

  static getInstance() {
    if (!this.instance) {
      this.instance = new ApiService();
    }
    return this.instance;
  }
}`,
	],
	python: [
		`def check_password(password):
    if password == "admin123":
        return True
    if password == "password":
        return True
    if password == "12345":
        return True
    return False`,
		`import os
os.system("rm -rf " + user_input)`,
		`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
# works great for n < 30
# do NOT try n = 50`,
		`try:
    do_something()
except:
    pass`,
		`class God:
    def __init__(self):
        self.db = Database()
        self.cache = Cache()
        self.logger = Logger()
        self.mailer = Mailer()
        self.auth = Auth()
        self.validator = Validator()
    def do_everything(self, request):
        self.validate(request)
        data = self.db.query(request)
        self.cache.set(data)
        self.logger.log(data)
        self.mailer.send(data)
        return data`,
		`passwords = []
with open("users.csv") as f:
    for line in f:
        user, pwd = line.strip().split(",")
        passwords.append(pwd)
print(passwords)  # debugging`,
		`def is_palindrome(s):
    reversed_s = ""
    for i in range(len(s) - 1, -1, -1):
        reversed_s += s[i]
    if s == reversed_s:
        return True
    else:
        return False`,
		`from time import sleep
def retry(func, times=100):
    for i in range(times):
        try:
            return func()
        except:
            sleep(0.001)
    return None  # silently fail`,
		`global_state = {}

def process(data):
    global global_state
    global_state["last"] = data
    global_state["count"] = global_state.get("count", 0) + 1
    if global_state["count"] > 100:
        global_state = {}
    return global_state`,
	],
	java: [
		`catch (Exception e) {
  // ignore
}`,
		`public String getType(Object obj) {
  if (obj instanceof String) return "string";
  if (obj instanceof Integer) return "integer";
  if (obj instanceof Boolean) return "boolean";
  if (obj instanceof Double) return "double";
  if (obj instanceof Float) return "float";
  if (obj instanceof Long) return "long";
  if (obj instanceof Character) return "character";
  return "unknown";
}`,
		`public boolean isPositive(int n) {
  if (n > 0) {
    return true;
  } else {
    return false;
  }
}`,
		`String query = "SELECT * FROM users WHERE id = " + userId;
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(query);`,
		`public class Utils {
  public static Object doStuff(Object input) {
    if (input == null) return null;
    return input.toString();
  }
  public static Object doMoreStuff(Object input) {
    return doStuff(doStuff(input));
  }
}`,
		`ArrayList list = new ArrayList();
list.add("hello");
list.add(42);
list.add(true);
list.add(null);
String first = (String) list.get(0);`,
		`public void sendEmail(String to, String subject, String body) {
  // TODO: implement
  System.out.println("Email sent to " + to);
}`,
		`synchronized(this) {
  synchronized(other) {
    // definitely no deadlock here
    this.data = other.getData();
    other.setData(this.data);
  }
}`,
	],
	sql: [
		`SELECT * FROM users WHERE 1=1
-- TODO: add authentication`,
		`DELETE FROM orders
-- WHERE order_date < '2020-01-01'`,
		`SELECT *
FROM users u, orders o, products p, reviews r
WHERE u.id = o.user_id
AND o.product_id = p.id
AND r.product_id = p.id`,
		`UPDATE accounts
SET balance = balance - 100
WHERE user_id = 1;
-- no transaction needed right?`,
		`SELECT name, email,
  (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
  (SELECT SUM(total) FROM orders WHERE user_id = u.id) as total_spent,
  (SELECT MAX(date) FROM orders WHERE user_id = u.id) as last_order
FROM users u;`,
		`INSERT INTO logs (message, created_at)
VALUES (CONCAT('User action: ', @user_input), NOW());`,
		`CREATE TABLE users (
  id INT,
  name VARCHAR(50),
  data TEXT
);
-- no primary key, no indexes, no constraints
-- living dangerously`,
	],
	go: [
		`func handleError(err error) {
	if err != nil {
		panic(err)
	}
}`,
		`result, _ := doSomething()
data, _ := json.Marshal(result)
resp, _ := http.Post(url, "application/json", bytes.NewBuffer(data))
body, _ := io.ReadAll(resp.Body)`,
		`var globalDB *sql.DB

func init() {
	db, err := sql.Open("postgres", os.Getenv("DB"))
	if err != nil {
		log.Fatal(err)
	}
	globalDB = db
}`,
		`func processItems(items []Item) {
	for i := 0; i < len(items); i++ {
		go func() {
			process(items[i]) // race condition
		}()
	}
}`,
		`func parseInt(s string) int {
	n, _ := strconv.Atoi(s)
	return n // 0 on error, totally fine
}`,
	],
	rust: [
		`fn main() {
    unsafe {
        let ptr = 0x1234 as *mut i32;
        *ptr = 42;
    }
}`,
		`fn get_data() -> String {
    let result = some_function();
    match result {
        Ok(data) => data,
        Err(_) => panic!("it broke"),
    }
}`,
		`fn process(input: &str) -> &str {
    let s = String::from(input);
    let trimmed = s.trim();
    trimmed // returning reference to local
}`,
		`fn do_thing(x: Option<i32>) -> i32 {
    x.unwrap() // yolo
}`,
	],
	php: [
		`$query = "SELECT * FROM users WHERE name = '" . $_GET['name'] . "'";
$result = mysqli_query($conn, $query);`,
		`function sanitize($input) {
  return $input; // TODO: actually sanitize
}`,
		`$data = unserialize($_COOKIE['session']);
$user = $data['user'];
$admin = $data['is_admin'];`,
		`if ($_POST['password'] == "supersecret") {
  $_SESSION['admin'] = true;
  header("Location: /admin");
}`,
		`function getPrice($item) {
  global $db, $cache, $logger, $config;
  $logger->info("Getting price");
  $price = $cache->get($item);
  if (!$price) {
    $price = $db->query("SELECT price FROM items WHERE id = $item");
    $cache->set($item, $price);
  }
  return $price;
}`,
	],
	ruby: [
		`def admin?
  params[:admin] == "true"
end`,
		`def calculate(a, b, op)
  eval("#{a} #{op} #{b}")
end`,
		`begin
  do_something_dangerous
rescue => e
  retry
end`,
		`class User < ApplicationRecord
  def full_info
    "#{name} (#{email}) - #{address} - #{phone} - " \\
    "#{role} - #{created_at} - #{updated_at} - " \\
    "#{orders.count} orders - $#{orders.sum(:total)}"
  end
end`,
	],
	csharp: [
		`public async Task<string> GetData()
{
    var result = GetDataAsync().Result; // deadlock
    return result;
}`,
		`public void Process(object input)
{
    var str = input as string;
    Console.WriteLine(str.Length); // null ref
}`,
		`public static class Globals
{
    public static string ConnectionString;
    public static int CurrentUserId;
    public static bool IsDebug;
    public static List<string> Errors = new();
}`,
		`catch (Exception)
{
    throw new Exception("An error occurred");
    // original stack trace: gone
}`,
	],
};

// Diffs pré-montados por linguagem: pares (removed, added)
const DIFF_TEMPLATES: Record<
	string,
	Array<{ removed: string[]; added: string[]; context?: string[] }>
> = {
	javascript: [
		{
			context: ["function calculateTotal(items) {"],
			removed: [
				"  var total = 0;",
				"  for (var i = 0; i < items.length; i++) {",
				"    total = total + items[i].price;",
				"  }",
			],
			added: [
				"  const total = items.reduce((sum, item) => sum + item.price, 0);",
			],
		},
		{
			removed: ['eval(prompt("enter code"))'],
			added: [
				'const userInput = prompt("enter code") ?? "";',
				"const sanitized = DOMPurify.sanitize(userInput);",
			],
		},
		{
			removed: [
				'if (user.role == "admin") {',
				'} else if (user.role == "Admin") {',
				'} else if (user.role == "ADMIN") {',
			],
			added: [
				'if (user.role.toLowerCase() === "admin") {',
				"  showAdminPanel();",
			],
		},
		{
			removed: [
				"  fetch('/api/users')",
				"    .then(r => r.json())",
				"    .then(data => {",
			],
			added: [
				"  const response = await fetch('/api/users');",
				"  const data = await response.json();",
			],
		},
	],
	typescript: [
		{
			removed: ["function processData(data: any): any {"],
			added: [
				"function processData<T extends Record<string, unknown>>(data: T): T {",
			],
		},
		{
			removed: ["// @ts-ignore", "const result = dangerousFunction();"],
			added: [
				"const result = dangerousFunction();",
				"if (!result) throw new Error('Expected result');",
			],
		},
		{
			removed: ["const user = {} as User;"],
			added: [
				"const user: User = {",
				'  name: "",',
				"  age: 0,",
				'  email: "",',
				"};",
			],
		},
	],
	python: [
		{
			removed: ["except:", "    pass"],
			added: ["except SpecificError as e:", "    logger.error(f'Failed: {e}')"],
		},
		{
			removed: ['os.system("rm -rf " + user_input)'],
			added: [
				"import shlex",
				"subprocess.run(['rm', '-rf', shlex.quote(user_input)], check=True)",
			],
		},
		{
			removed: [
				"def fibonacci(n):",
				"    if n <= 1:",
				"        return n",
				"    return fibonacci(n-1) + fibonacci(n-2)",
			],
			added: [
				"from functools import lru_cache",
				"",
				"@lru_cache(maxsize=None)",
				"def fibonacci(n: int) -> int:",
				"    if n <= 1:",
				"        return n",
				"    return fibonacci(n - 1) + fibonacci(n - 2)",
			],
		},
	],
	java: [
		{
			removed: ["catch (Exception e) {", "  // ignore", "}"],
			added: [
				"catch (DatabaseException e) {",
				'  logger.error("Query failed", e);',
				"  throw new ServiceException(e);",
				"}",
			],
		},
		{
			removed: ['String query = "SELECT * FROM users WHERE id = " + userId;'],
			added: [
				'String query = "SELECT * FROM users WHERE id = ?";',
				"PreparedStatement stmt = conn.prepareStatement(query);",
				"stmt.setString(1, userId);",
			],
		},
	],
	sql: [
		{
			removed: ["SELECT * FROM users WHERE 1=1"],
			added: [
				"SELECT id, username, email",
				"FROM users",
				"WHERE active = true",
				"LIMIT 100;",
			],
		},
		{
			removed: ["DELETE FROM orders"],
			added: [
				"BEGIN;",
				"DELETE FROM orders",
				"WHERE order_date < '2020-01-01';",
				"-- verify row count before committing",
				"COMMIT;",
			],
		},
	],
	go: [
		{
			removed: ["result, _ := doSomething()"],
			added: [
				"result, err := doSomething()",
				"if err != nil {",
				'  return fmt.Errorf("doSomething: %w", err)',
				"}",
			],
		},
		{
			removed: ["  go func() {", "    process(items[i])", "  }()"],
			added: ["  go func(item Item) {", "    process(item)", "  }(items[i])"],
		},
	],
	rust: [
		{
			removed: ['  Err(_) => panic!("it broke"),'],
			added: [
				"  Err(e) => {",
				'    eprintln!("Error: {e}");',
				"    return Err(e);",
				"  }",
			],
		},
		{
			removed: ["  x.unwrap() // yolo"],
			added: ['  x.unwrap_or_else(|| panic!("expected Some value"))'],
		},
	],
	php: [
		{
			removed: [
				"$query = \"SELECT * FROM users WHERE name = '\" . $_GET['name'] . \"'\";",
			],
			added: [
				'$stmt = $pdo->prepare("SELECT * FROM users WHERE name = ?");',
				"$stmt->execute([$_GET['name']]);",
			],
		},
	],
	ruby: [
		{
			removed: ['  eval("#{a} #{op} #{b}")'],
			added: [
				"  case op",
				'  when "+" then a + b',
				'  when "-" then a - b',
				'  when "*" then a * b',
				'  when "/" then a.to_f / b',
				'  else raise ArgumentError, "Unknown operator: #{op}"',
				"  end",
			],
		},
	],
	csharp: [
		{
			removed: ["  var result = GetDataAsync().Result;"],
			added: ["  var result = await GetDataAsync();"],
		},
		{
			removed: ['  throw new Exception("An error occurred");'],
			added: [
				'  throw new InvalidOperationException("Processing failed", ex);',
			],
		},
	],
};

// ---------------------------------------------------------------------------
// Geração de um roast completo
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: readonly T[]): T {
	return arr[faker.number.int({ min: 0, max: arr.length - 1 })] as T;
}

function pickRandomN<T>(arr: readonly T[], n: number): T[] {
	const shuffled = faker.helpers.shuffle([...arr]);
	return shuffled.slice(0, n);
}

function generateRoast(index: number) {
	const language = pickRandom(LANGUAGES);
	const snippets = CODE_SNIPPETS[language];
	if (!snippets || snippets.length === 0) {
		throw new Error(`No snippets for language: ${language}`);
	}
	const code = pickRandom(snippets);
	const lineCount = code.split("\n").length;

	// Score de 0.5 a 9.5, com distribuição tendendo para notas baixas (mais divertido)
	const score =
		Math.round(
			faker.number.float({ min: 0.5, max: 9.5 }) *
				faker.number.float({ min: 0.3, max: 1.0 }) *
				10,
		) / 10 || 0.5;

	// Verdict baseado no score
	const verdictIndex = Math.min(
		Math.floor(((10 - score) / 10) * VERDICTS.length),
		VERDICTS.length - 1,
	);
	const verdict = VERDICTS[verdictIndex] as string;

	const quote = pickRandom(QUOTES);
	const roastMode = faker.datatype.boolean({ probability: 0.85 });

	// 3 a 4 issues por roast, com mix de severities
	const issueCount = faker.number.int({ min: 3, max: 4 });
	const issues = pickRandomN(ISSUE_POOL, issueCount);

	// Diffs: usa template da linguagem se disponível, senão cria genérico
	const langDiffs = DIFF_TEMPLATES[language];
	const diffTemplate = langDiffs
		? pickRandom(langDiffs)
		: {
				removed: [code.split("\n")[0] ?? "// old code"],
				added: ["// improved version"],
			};

	const diffs: Array<{ type: DiffType; code: string }> = [];
	if (diffTemplate.context) {
		for (const line of diffTemplate.context) {
			diffs.push({ type: "context", code: line });
		}
	}
	for (const line of diffTemplate.removed) {
		diffs.push({ type: "removed", code: line });
	}
	for (const line of diffTemplate.added) {
		diffs.push({ type: "added", code: line });
	}

	// createdAt espalhado nos últimos 90 dias
	const createdAt = faker.date.recent({ days: 90 });

	return {
		id: nanoid(12),
		code,
		language,
		lineCount,
		score,
		verdict,
		quote,
		roastMode,
		createdAt,
		issues,
		diffs,
	};
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const TOTAL = 100;

async function seed() {
	// Limpa tabelas na ordem correta (FKs)
	console.log("Cleaning existing data...");
	await db.delete(roastDiffs);
	await db.delete(roastIssues);
	await db.delete(roasts);

	console.log(`Seeding ${TOTAL} roasts...\n`);

	for (let i = 0; i < TOTAL; i++) {
		const roast = generateRoast(i);

		await db.transaction(async (tx) => {
			await tx.insert(roasts).values({
				id: roast.id,
				code: roast.code,
				language: roast.language,
				lineCount: roast.lineCount,
				score: roast.score,
				verdict: roast.verdict,
				quote: roast.quote,
				roastMode: roast.roastMode,
				createdAt: roast.createdAt,
			});

			await tx.insert(roastIssues).values(
				roast.issues.map((issue, order) => ({
					roastId: roast.id,
					severity: issue.severity,
					title: issue.title,
					description: issue.description,
					order,
				})),
			);

			await tx.insert(roastDiffs).values(
				roast.diffs.map((diff, order) => ({
					roastId: roast.id,
					type: diff.type,
					code: diff.code,
					order,
				})),
			);
		});

		const pad = String(i + 1).padStart(3, " ");
		console.log(
			`  ${pad}. [${roast.score.toFixed(1).padStart(4)}] ${roast.verdict} — ${roast.language} (${roast.lineCount} lines) → ${roast.id}`,
		);
	}

	console.log(`\nDone. Inserted ${TOTAL} roasts.`);
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
