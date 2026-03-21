# Android Jetpack Compose - Quick Reference Guide

## 🚀 What is Compose?

**Jetpack Compose** is Android's modern, declarative UI toolkit. Build UIs by describing what they should look like, not how to build them. Compose automatically updates the UI when state changes.

**Key Benefits:**
- Up to **40% less code** than XML layouts
- **Intuitive** - UI code matches what you see on screen  
- **Real-time preview** in Android Studio
- **Smart recomposition** - optimal performance
- **100% Kotlin** - leverages modern language features
- **Fully interoperable** with existing Views

---

## 📋 Setup

### Dependencies

```gradle
dependencies {
    // Core Compose
    implementation "androidx.compose.ui:ui:1.6.0"
    implementation "androidx.compose.material3:material3:1.2.0"
    implementation "androidx.compose.ui:ui-tooling-preview:1.6.0"
    debugImplementation "androidx.compose.ui:ui-tooling:1.6.0"
    
    // Essential integrations
    implementation "androidx.activity:activity-compose:1.8.0"
    implementation "androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0"
    implementation "androidx.navigation:navigation-compose:2.7.0"
}
```

### Enable Compose

```gradle
android {
    buildFeatures {
        compose true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}
```

### Hello World Example

```kotlin
@Composable
fun Greeting(name: String) {
    Text("Hello, $name!")
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    Greeting("Android")
}
```

### Activity Setup

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface {
                    Greeting("Android")
                }
            }
        }
    }
}
```

---

## 🔄 Core Concepts

### Composable Function

```kotlin
@Composable
fun MyComponent() {
    Text("This is a composable function")
}
```

**Rules:**
- Annotated with `@Composable`
- Describe UI, don't manage it
- Fast and idempotent
- Should not maintain internal state

### State & Recomposition

When state changes → Compose re-runs composables → UI updates automatically

```kotlin
@Composable
fun Counter() {
    // remember: survives recomposition
    var count by remember { mutableStateOf(0) }
    
    Button(onClick = { count++ }) {
        Text("Count: $count")
    }
}
```

### remember Variants

```kotlin
// Basic state
var state by remember { mutableStateOf("value") }

// State + rememberSaveable (survives config changes)
var saved by rememberSaveable { mutableStateOf(0) }

// Derived state (optimized recomputation)
var derived by remember { derivedStateOf { items.filter { it.selected } } }

// Keyed remember (recalculates when key changes)
var keyed by remember(key) { mutableStateOf(initialValue) }
```

### State Hoisting

**State in parent, stateless child** → More reusable components

```kotlin
// ❌ Stateful (hard to reuse)
@Composable
fun BadCounter() {
    var count by remember { mutableStateOf(0) }
    Text("$count")
    Button(onClick = { count++ })
}

// ✅ Stateless (highly reusable)
@Composable  
fun GoodCounter(count: Int, onIncrement: () -> Unit) {
    Text("$count")
    Button(onClick = onIncrement)
}
```

### Side Effects

```kotlin
// Runs suspend functions, cancels on exit
LaunchedEffect(key) { /* coroutine */ }

// For cleanup operations
DisposableEffect(key) {
    // setup
    onDispose { /* cleanup */ }
}

// Runs after every recomposition
SideEffect { /* logging, analytics */ }

// Converts flow/livedata to state
val state = produceState(initial) { /* emit values */ }
```

---

## 📐 Layouts

### Basic Layouts

```kotlin
// Vertical layout  
Column(modifier = Modifier.padding(16.dp)) {
    Text("Top")
    Text("Middle") 
    Text("Bottom")
}

// Horizontal layout
Row(horizontalArrangement = Arrangement.SpaceBetween) {
    Text("Left")
    Text("Right")
}

// Stack layout
Box(modifier = Modifier.fillMaxSize()) {
    Image(painter = bg, contentDescription = null)
    Text("Overlay", modifier = Modifier.align(Alignment.Center))
}
```

### Modifiers

```kotlin
Modifier
    .padding(16.dp)                    // Add padding
    .fillMaxWidth()                    // Fill width  
    .size(200.dp)                     // Fixed size
    .background(Color.Blue)            // Background color
    .border(2.dp, Color.Black)         // Border
    .clip(RoundedCornerShape(8.dp))   // Rounded corners
    .clickable { }                     // Click listener
    .alpha(0.5f)                        // Transparency
    .verticalScroll(scrollState)       // Vertical scrolling
```

**Modifier Order Matters:** Size → Background → Padding → Clickable

### Lazy Lists

```kotlin
// Large vertical list (recycles like RecyclerView)
LazyColumn {
    items(1000) { index ->
        Text("Item $index")
    }
}

// With custom data
LazyColumn {
    items(items, key = { it.id }) { item ->
        ItemRow(item)
    }
}

// Horizontal list
LazyRow { items(data) { ItemRow(it) } }

// Grid
LazyVerticalGrid(columns = GridCells.Fixed(3)) {
    items(data) { GridItem(it) }
}
```

**Performance tip:** Always provide `key` for `items()`

### ConstraintLayout

```kotlin
ConstraintLayout(modifier = Modifier.fillMaxSize()) {
    val (button, text) = createRefs()
    
    Button(
        onClick = {},
        modifier = Modifier.constrainAs(button) {
            top.linkTo(parent.top, margin = 16.dp)
        }
    )
    
    Text("Hello", modifier = Modifier.constrainAs(text) {
        top.linkTo(button.bottom, margin = 16.dp)
        centerHorizontallyTo(parent)
    })
}
```

---

## 🔨 UI Components

### Material 3 Components

```kotlin
// Buttons
Button(onClick = {}) { Text("Primary") }
OutlinedButton(onClick = {}) { Text("Outline") }
TextButton(onClick = {}) { Text("Text") }
ElevatedButton(onClick = {}) { Text("Elevated") }

// TextField
var text by remember { mutableStateOf("") }
TextField(
    value = text,
    onValueChange = { text = it },
    label = { Text("Label") },
    placeholder = { Text("Hint") }
)

// Card
Card(elevation = CardDefaults.cardElevation(6.dp)) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Title", style = MaterialTheme.typography.titleMedium)
        Text("Content")
    }
}

// TopAppBar
TopAppBar(
    title = { Text("App") },
    navigationIcon = {
        IconButton(onClick = {}) {
            Icon(Icons.Default.Menu, "Menu")
        }
    },
    actions = {}
)

// Scaffold (main layout)
Scaffold(
    topBar = { TopAppBar(title = { Text("App") }) },
    floatingActionButton = {
        FloatingActionButton(onClick = {}) {
            Icon(Icons.Default.Add, "Add")
        }
    }
) { padding ->
    Content(modifier = Modifier.padding(padding))
}
```

---

## 🎨 Theming

### Material 3 Theme

```kotlin
// In Theme.kt
private val LightColors = lightColorScheme(
    primary = Color(0xFF6200EE),
    onPrimary = Color.White,
    secondary = Color(0xFF03DAC6)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFCFBCFF),
    secondary = Color(0xFF66FFF9)
)

@Composable
fun MyAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
```

**Typography**
```kotlin
val Typography = Typography(
    headlineLarge = TextStyle(fontSize = 32.sp),
    headlineMedium = TextStyle(fontSize = 28.sp),
    bodyLarge = TextStyle(fontSize = 16.sp)
)
```

**Using in components:**
```kotlin
Text("Title", style = MaterialTheme.typography.headlineMedium)
Text("Body", style = MaterialTheme.typography.bodyLarge)
Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer))
```

### Custom Design System

```kotlin
@Stable
class AppColors(val background: Color, val surface: Color)

val LocalAppColors = compositionLocalOf { AppColors.Light }

@Composable
fun ProvideAppColors(colors: AppColors, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalAppColors provides colors) {
        content()
    }
}

@Composable
fun CustomCard() {
    val colors = LocalAppColors.current
    Card(containerColor = colors.surface) { /*...*/ }
}
```

---

## 🌊 State Management

### State Holder Pattern

```kotlin
class ScreenStateHolder {
    var email by mutableStateOf("")
    var password by mutableStateOf("")
    var isLoading by mutableStateOf(false)
    
    val isFormValid: Boolean
        get() = email.isNotBlank() && password.length > 6
}

@SuppressLint("RememberReturnType")
@Composable
fun FormScreen() {
    val state = remember { ScreenStateHolder() }
    
    TextField(value = state.email, onValueChange = { state.email = it })
    TextField(value = state.password, onValueChange = { state.password = it })
    Button(
        enabled = state.isFormValid,
        onClick = { state.isLoading = true }
    ) {
        Text("Submit")
    }
}
```

### ViewModel Integration

```kotlin
class MyViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    data class UiState(
        val loading: Boolean = false,
        val items: List<Item> = emptyList()
    )
}

@Composable
fun MyScreen(viewModel: MyViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    
    if (uiState.loading) Loading()
    else List(uiState.items)
}
```

### Unidirectional Data Flow (UDF)

**State flows down, events flow up**

```kotlin
// Parent (holds state)
@Composable
fun Parent() {
    var items by remember { mutableStateOf(listOf<Item>()) }
    
    Screen(
        items = items,
        onAdd = { items = items + it },
        onRemove = { items = items - it }
    )
}

// Child (stateless, receives callbacks)
@Composable
fun Screen(
    items: List<Item>,
    onAdd: (Item) -> Unit,
    onRemove: (Item) -> Unit
) {
    LazyColumn {
        items(items) { item ->
            ItemRow(
                item = item,
                onDelete = { onRemove(item) }
            )
        }
    }
    
    Button(onClick = { onAdd(Item())) {
        Text("Add")
    }
}
```

---

## 🎬 Animations

### Basic Animations

```kotlin
// Animate a single value
val alpha by animateFloatAsState(
    targetValue = if (visible) 1f else 0f,
    label = "alpha"
)
Box(modifier = Modifier.alpha(alpha))

// Animated visibility
AnimatedVisibility(visible = expanded) {
    Text("Content")
}

// Animated content size
Box(modifier = Modifier.animateContentSize().clickable { expanded = !expanded }) {
    Text(if (expanded) "Long content" else "Short")
}
```

### Advanced Animations

```kotlin
// Transition for multiple values
val transition = updateTransition(targetState = expanded, label = "expand")

val size by transition.animateDp(label = "size") { if (it) 200.dp else 100.dp }
val radius by transition.animateDp(label = "corner") { if (it) 0.dp else 8.dp }
Box(
    modifier = Modifier
        .size(size)
        .clip(RoundedCornerShape(radius))
)

// Custom animatable
val color = remember { Animatable(Color.Gray) }
LaunchedEffect(enabled) {
    color.animateTo(if (enabled) Color.Green else Color.Gray)
}

// Infinite animation
val infinite = rememberInfiniteTransition()
val angle by infinite.animateFloat(
    initialValue = 0f, targetValue = 360f,
    animationSpec = infiniteRepeatable(tween(2000))
)
Box(modifier = Modifier.graphicsLayer { rotationZ = angle })
```

### Custom Graphics

```kotlin
Canvas(modifier = Modifier.size(200.dp)) {
    drawCircle(color = Color.Blue, center = center, radius = 100f)
    drawLine(Color.Red, start = Offset.Zero, end = Offset(size.width, size.height))
    drawRect(Color.Green, topLeft = Offset(50f, 50f), size = Size(100f, 100f))
}
```

---

## 🧭 Navigation

### Navigation Setup

```gradle
implementation "androidx.navigation:navigation-compose:2.7.7"
```

```kotlin
@Composable
fun MyApp() {
    val navController = rememberNavController()
    
    NavHost(navController, startDestination = "home") {
        composable("home") { HomeScreen(navController) }
        composable("details/{itemId}") { entry ->
            DetailsScreen(entry.arguments?.getString("itemId"))
        }
        composable("settings") { SettingsScreen() }
    }
}
```

### Navigation Actions

```kotlin
// Navigate to route
navController.navigate("details/123")

// Navigate with options
navController.navigate("details") {
    popUpTo("home") { inclusive = true }
    launchSingleTop = true
}

// Go back
navController.navigateUp()
navController.popBackStack()

// Arguments
composable(
    "detail/{id}",
    arguments = listOf(navArgument("id") { type = NavType.StringType })
) { entry ->
    DetailScreen(id = entry.arguments?.getString("id"))
}
```

### Bottom Navigation

```kotlin
BottomNavigation {
    val current = currentRoute(navController)
    
    items.forEach { screen ->
        BottomNavigationItem(
            icon = { Icon(Icons.Default.Home, null) },
            label = { Text(screen) },
            selected = current == screen,
            onClick = { navController.navigate(screen) }
        )
    }
}
```

### Bottom Sheet

```kotlin
val bottomSheetNavigator = rememberBottomSheetNavigator()
val navController = rememberNavController(bottomSheetNavigator)

ModalBottomSheetLayout(bottomSheetNavigator) {
    NavHost(navController, startDestination = "home") {
        composable("home") { HomeScreen(navController) }
        bottomSheet("sheet") { BottomSheetContent() }
    }
}
```

---

## 🔄 Interoperability

### Views in Compose

```kotlin
// WebView
AndroidView(
    factory = { context -> WebView(context).apply { loadUrl("https://google.com") } },
    modifier = Modifier.fillMaxSize()
)

// AdView
AndroidView(factory = { context ->
    AdView(context).apply {
        setAdSize(AdSize.BANNER)
        adUnitId = "your-ad-id"
        loadAd(AdRequest.Builder().build())
    }
})
```

### Compose in Views/Fragments

```kotlin
// In Fragment
override fun onCreateView(...): View {
    return ComposeView(requireContext()).apply {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            MaterialTheme {
                MyComposeContent()
            }
        }
    }
}

// In XML layout
<androidx.compose.ui.platform.ComposeView
    android:id="@+id/compose_view"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

---

## ⚡ Performance

### Best Practices

```kotlin
// ✅ Remember expensive calculations
val filtered = remember(items) {
    items.filter { heavyWork() }.sortedBy { it.name }
}

// ✅ Use keys for lists
LazyColumn {
    items(items, key = { it.id }) { ItemRow(it) }
}

// ✅ Stable lambdas
val onClick = remember(item) { { handleClick(item.id) } }
ItemRow(item, onClick = onClick)

// ✅ derivedStateOf for expensive derived state
val filtered by remember(items) {
    derivedStateOf { 
        items.filter { it.selected }.sortedBy { it.priority } 
    }
}

// ❌ Don't read frequently changing state
// BAD: Text(System.currentTimeMillis().toString())
// GOOD: Remember + LaunchedEffect with delay()
```

### Stable Types

```kotlin
// ❌ Unstable (var properties)
data class Bad(var name: String, var selected: Boolean)

// ✅ Stable (val properties)  
data class Good(val name: String, val selected: Boolean)
```

### Optimization Levels

- **First composition:** Avoid heavy work
- **Recomposition:** Should be lightweight
- **Smart skipping:** Compose only recomposes what changed
- **Skipable functions:** Stable parameters help optimization

---

## 🧪 Testing

### Setup

```gradle
dependencies {
    androidTestImplementation "androidx.compose.ui:ui-test-junit4:1.6.0"
    debugImplementation "androidx.compose.ui:ui-test-manifest:1.6.0"
}
```

### Basic Tests

```kotlin
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun myTest() {
    // Start app
    composeTestRule.setContent { MyApp() }
    
    // Find and interact
    composeTestRule.onNodeWithText("Click me").performClick()
    
    // Verify
    composeTestRule.onNodeWithText("Count: 1").assertIsDisplayed()
}
```

### Finding Nodes

```kotlin
// By text
onNodeWithText("Hello")
onNodeWithText("Hello", substring = true)

// By content description  
onNodeWithContentDescription("Back")

// By tag
onNodeWithTag("my-tag")

// Combined
onNode(hasClickAction() and hasText("Submit"))
```

### Assertions

```kotlin
assertExists()
assertIsDisplayed()
assertIsEnabled()
assertTextEquals("Exact")
assertTextContains("Partial")
```

### Actions

```kotlin
performClick()
performTextInput("text")
performTextClear()
performTouchInput { swipeDown() }
```

### Lists

```kotlin
// Scroll to index
onNodeWithTag("list").performScrollToIndex(99)

// Scroll to text
onNodeWithTag("list").performScrollToNode(hasText("Item 50"))

// Get first child
.onNodeWithTag("list").onChildren()[0]
```

---

## ♿ Accessibility

### Content Descriptions

```kotlin
// For interactive elements
Icon(Icons.Close, "Close dialog")

// For decorative (hide from screen reader)
Icon(Icons.Default.Star, contentDescription = null)

// For complex graphics
Canvas(modifier = Modifier.semantics {
    contentDescription = "Chart showing Q1 performance: 15% increase"
}) { /* ... */ }
```

### Merge Semantics

```kotlin
// Merge children into single element
Row(
    modifier = Modifier.semantics(mergeDescendants = true) {}
) {
    Icon(Icons.Account, null)
    Text("Profile")
    Icon(Icons.Forward, null)
}
// Screen reader: "Profile" (single combined element)
```

### Focus Management

```kotlin
// Request focus
val focusRequester = remember { FocusRequester() }
TextField(modifier = Modifier.focusRequester(focusRequester))
LaunchedEffect(Unit) { focusRequester.requestFocus() }

// Clear focus
LocalFocusManager.current.clearFocus()
```

---

## 📚 Essential Snippet Library

### 📱 Use Everywhere

```kotlin
// Remember with keys
var value by remember(key) { mutableStateOf(initial) }

// State holder
class StateHolder {
    var field by mutableStateOf("")
}

// ViewModel state
val state by viewModel.state.collectAsState()

// Resource helpers
val str = stringResource(R.string.name)
val drawable = painterResource(R.drawable.icon)
val dimen = dimensionResource(R.dimen.padding)
```

### 📐 Layout Utilities

```kotlin
// Standard spacing
Column(verticalArrangement = Arrangement.spacedBy(8.dp))
Row(horizontalArrangement = Arrangement.spacedBy(8.dp))

// Center alignment
Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.Center
)

// ConstraintLayout anchors
density -> ( (.Size).`12927) }
    top.linkTo(parent.top)
    start.linkTo(parent.start)
    end.linkTo(parent.end)
    bottom.linkTo(parent.bottom)
}
```

### 🎨 Theming

```kotlin
// Dynamic color
val colors = when {
    dynamicColor && darkTheme -> dynamicDarkColorScheme(context)
    dynamicColor && !darkTheme -> dynamicLightColorScheme(context)
    darkTheme -> darkColorScheme()
    else -> lightColorScheme()
}

// Custom surface
Surface(
    modifier = Modifier.fillMaxSize(),
    color = MaterialTheme.colorScheme.background
)

// Typography hierarchy
Text("Large title", style = MaterialTheme.typography.displayLarge)
Text("Medium title", style = MaterialTheme.typography.headlineMedium)  
Text("Small title", style = MaterialTheme.typography.titleSmall)
Text("Body", style = MaterialTheme.typography.bodyMedium)
Text("Caption", style = MaterialTheme.typography.labelSmall)
```

### 🔄 State Flow

```kotlin
// Single source of truth
@Composable
fun Parent() {
    var state by remember { mutableStateOf(initial) }
    Child(state = state, onStateChange = { state = it })
}

// ViewModel
class VM : ViewModel() {
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()
}

@Composable
fun Screen(vm: VM = viewModel()) {
    val state by vm.state.collectAsState()
    // ...
}
```

### 🧩 Common Patterns

```kotlin
// Loading state
when {
    uiState.loading -> LoadingIndicator()
    uiState.error != null -> ErrorMessage(uiState.error)
    else -> Content(uiState.data)
}

// List with empty state
if (items.isEmpty()) {
    EmptyState()
} else {
    LazyColumn { items(items) { Item(it) } }
}

// Confirmation dialog
var show by remember { mutableStateOf(false) }
if (show) {
    AlertDialog(
        onDismissRequest = { show = false },
        title = { Text("Confirm") },
        text = { Text("Are you sure?") },
        confirmButton = {
            Button(onClick = { show = false }) { Text("Yes") }
        },
        dismissButton = {
            TextButton(onClick = { show = false }) { Text("No") }
        }
    )
}

// Snackbar
val scope = rememberCoroutineScope()
val host = LocalSnackbarHost.current
scope.launch {
    host.showSnackbar("Action completed", actionLabel = "Undo")
}
```

---

## 🔍 Quick Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **Preview not showing** | Add `@Preview(showBackground = true)`, check compose dependencies |
| **Preview requires theme** | Wrap in `MaterialTheme { }` |
| **State not persisting** | Use `rememberSaveable` not `remember` |
| **Frequent recompositions** | Use `derivedStateOf`, ensure stable types |
| **List performance** | Switch `Column` → `LazyColumn`, add keys |
| **Click not working** | Apply `clickable` before other modifiers |
| **Image not loading** | Check coil dependency + internet permission |
| **Compose View in XML crashes** | Call `setViewCompositionStrategy()` |

### Performance Checklist

- [ ] Use `LazyColumn`/`LazyRow` for lists > 20 items
- [ ] Provide `key` for list items
- [ ] Remember expensive calculations
- [ ] Use `derivedStateOf` for expensive derived state
- [ ] Keep composables small and focused
- [ ] Lift state up (don't store in leaf nodes)
- [ ] Use stable classes (val props, not var)
- [ ] Profile with compiler metrics
- [ ] Check `@Preview` annotations are present
- [ ] Avoid `SideEffect` for logic that can be remembered

---

## 📖 Learning Path

### Level 1: Basics ✅
1. ✅ `@Composable` fundamentals
2. ✅ Basic layouts (Column, Row, Box)
3. ✅ Modifiers basics
4. ✅ `remember` and `mutableStateOf`
5. ✅ Preview annotations

### Level 2: Intermediate 🔨
1. 🔨 Lazy layouts (LazyColumn, LazyRow)
2. 🔨 Material 3 components
3. 🔨 Theming and colors
4. 🔨 State hoisting
5. 🔨 Side effects (LaunchedEffect, DisposableEffect)
6. 🔨 Animations basics
7. 🔨 Navigation

### Level 3: Advanced 🚀
1. 🚀 Custom layouts (Layout function)
2. 🚀 Canvas and graphics
3. 🚀 Advanced animations and transitions
4. 🚀 Performance optimization
5. 🚀 Testing strategies
6. 🚀 Accessibility best practices
7. 🚀 Multi-module apps

### Level 4: Expert 💎
1. 💎 Custom design systems
2. 💎 Complex state management patterns
3. 💎 Window insets and foldables
4. 💎 Compiler metrics and profiling
5. 💎 Accessibility automation
6. 💎 Building Compose libraries

---

## 🔗 Official Resources

- 📘 **Official Docs**: https://developer.android.com/develop/ui/compose/documentation
- 🎥 **Video Codelabs**: https://developer.android.com/courses/pathways/compose
- 💻 **Sample Apps**: https://github.com/android/compose-samples
- 🛠️ **API Reference**: https://developer.android.com/reference/kotlin/androidx/compose/packages
- 👥 **Community**: https://stackoverflow.com/questions/tagged/android-jetpack-compose
- 🐛 **Issue Tracker**: https://issuetracker.google.com/issues?q=componentid:612128

---

## 🎯 TL;DR Quick Start

**Create a screen in 5 lines:**

```kotlin
@Composable
fun MyScreen(viewModel: MyViewModel = viewModel()) {
    val items by viewModel.items.collectAsState()
    
    LazyColumn {
        items(items) { item ->
            Card(modifier = Modifier.padding(8.dp)) {
                Text(item.name, Modifier.padding(16.dp))
            }
        }
    }
}
```

**Add state:**

```kotlin
@Composable
fun MyScreen() {
    var query by remember { mutableStateOf("") }
    
    SearchBar(query, onQueryChange = { query = it })
    Results(filteredBy(query))
}
```

**Navigate to details:**

```kotlin
@Composable
fun ItemRow(item: Item, navController: NavController) {
    Card(
        modifier = Modifier.clickable { 
            navController.navigate("detail/${item.id}") 
        }
    ) {
        Text(item.name)
    }
}
```

**Make it pretty:**

```kotlin
@Composable
fun BeautifulScreen(content: @Composable () -> Unit) {
    MaterialTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            content()
        }
    }
}
```

---

## ✨ Summary

Jetpack Compose brings:
- **Declarative UI** - describe what, not how
- **Kotlin first** - modern, type-safe, concise
- **Intelligent recompositions** - efficient updates
- **Material Design 3** - built-in beautiful components
- **Seamless interop** - works with existing Views
- **Amazing tooling** - preview, animations, tests

**Start simple, build complex.** Happy composing! 🎨