# Android Jetpack Compose - Comprehensive Documentation

Based on https://developer.android.com/develop/ui/compose/documentation

## Table of Contents

1. [Overview and Fundamentals](#overview-and-fundamentals)
2. [Core Concepts](#core-concepts)
3. [Layouts and UI Building Blocks](#layouts-and-ui-building-blocks)
4. [State and Data Flow](#state-and-data-flow)
5. [Design System and Theming](#design-system-and-theming)
6. [Navigation](#navigation)
7. [Animation and Graphics](#animation-and-graphics)
8. [Resource Management](#resource-management)
9. [Interoperability](#interoperability)
10. [Performance and Optimization](#performance-and-optimization)
11. [Testing](#testing)
12. [Accessibility](#accessibility)
13. [Advanced Topics](#advanced-topics)

---

## Overview and Fundamentals

### What is Jetpack Compose?

Jetpack Compose is Android's modern, fully declarative UI toolkit that simplifies UI development by allowing developers to describe what the UI should look like in their app, rather than how to build it. Compose automatically handles UI updates when the underlying state changes.

**Key Characteristics:**

- **Declarative UI**: Describe UI based on state, not step-by-step instructions
- **Kotlin-based**: Built entirely with Kotlin, leveraging language features
- **Composable Functions**: UI built from small, reusable building blocks
- **Real-time Preview**: Android Studio provides instant preview of Compose functions
- **Less Code**: Achieve more with significantly less code than traditional XML layouts

### Why Use Jetpack Compose?

**Advantages:**

1. **Less Code**: Reduce code by up to 40% compared to View-based Android development
2. **Intuitive**: UI code directly corresponds to what appears on screen
3. **Accelerated Development**: Real-time preview and hot reload capabilities
4. **Powerful**: Built-in Material Design components and animations
5. **Interoperable**: Works seamlessly with existing Android Views
6. **Maintainable**: Easier to understand and modify UI code

### Project Setup

**Dependencies:**

```gradle
dependencies {
    implementation "androidx.compose.ui:ui:1.6.0"
    implementation "androidx.compose.material3:material3:1.2.0"
    implementation "androidx.compose.ui:ui-tooling-preview:1.6.0"
    debugImplementation "androidx.compose.ui:ui-tooling:1.6.0"
    
    // Activity Compose for Activity support
    implementation "androidx.activity:activity-compose:1.8.0"
    
    // Lifecycle ViewModel Compose
    implementation "androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0"
    
    // Navigation Compose
    implementation "androidx.navigation:navigation-compose:2.7.0"
}
```

**Enable Compose:**

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

### Your First Composable

```kotlin
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview

@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    Greeting("Android")
}
```

### Activity Setup

```kotlin
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface

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

## Core Concepts

### Composable Functions

Composable functions are the fundamental building blocks of Compose UI. They are regular functions annotated with `@Composable` that describe UI elements.

**Rules for Composable Functions:**

1. **Must be annotated with** `@Composable`
2. **Can call other Composable functions**
3. **Should be fast, idempotent, and side-effect free**
4. **Should not maintain internal state**
5. **Executed in composition order**

```kotlin
@Composable
fun SimpleComposable() {
    // This is a composable function
    Text("Hello Compose")
}
```

### Composition and Recomposition

**Composition**: The process of running composable functions to build the UI tree

**Recomposition**: The process of re-running composable functions when their inputs change

**Key Principles:**

- Recomposition is **automatic** when state changes
- Compose **intelligently** skips composables with unchanged inputs
- Recomposition is **optimistic** and may be cancelled
- Composables should be **idempotent** (same output for same inputs)

```kotlin
@Composable
fun MyApp() {
    var count by remember { mutableStateOf(0) }
    
    Button(onClick = { count++ }) {
        Text("Count: $count")
    }
    // Only this Text recomposes when count changes
}
```

### State Management

#### remember

`remember` stores objects in the composition tree and survives recomposition.

```kotlin
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }
    
    Button(onClick = { count++ }) {
        Text("Count: $count")
    }
}
```

#### State Hoisting

Moving state to a higher level to make components reusable and testable.

```kotlin
// Stateful (bad for reusability)
@Composable
fun StatefulCounter() {
    var count by remember { mutableStateOf(0) }
    CounterDisplay(count, { count++ })
}

// Stateless (good for reusability)
@Composable
fun StatelessCounter(count: Int, onIncrement: () -> Unit) {
    CounterDisplay(count, onIncrement)
}
```

#### rememberSaveable

Survives configuration changes (like screen rotation).

```kotlin
@Composable
fun ConfigurationAwareCounter() {
    var count by rememberSaveable { mutableStateOf(0) }
    // Count persists through config changes
}
```

#### State Holders

Managing complex state in separate classes.

```kotlin
class LoginStateHolder {
    var username by mutableStateOf("")
    var password by mutableStateOf("")
    var isLoading by mutableStateOf(false)
    val isLoginEnabled: Boolean
        get() = username.isNotBlank() && password.length > 6
}

@Composable
fun LoginScreen() {
    val state = remember { LoginStateHolder() }
    LoginForm(state)
}
```

### Side Effects

Side effects are operations that escape the scope of composable functions.

#### LaunchedEffect

Runs suspend functions in a coroutine scope, cancels when leaving composition.

```kotlin
@Composable
fun MyComponent(lifecycleOwner: LifecycleOwner = LocalLifecycleOwner.current) {
    val state by produceState(initialValue = "loading", key1 = lifecycleOwner) {
        lifecycleOwner.lifecycleScope.launch {
            value = "loaded"
        }
    }
}
```

#### DisposableEffect

For side effects requiring cleanup.

```kotlin
@Composable
fun BackHandler(enabled: Boolean, onBack: () -> Unit) {
    val context = LocalContext.current
    val activity = context as ComponentActivity
    
    DisposableEffect(enabled) {
        val callback = onBackPressedDispatcher.addCallback(enabled) {
            onBack()
        }
        onDispose {
            callback.remove()
        }
    }
}
```

#### SideEffect

Runs on every successful recomposition.

```kotlin
@Composable
fun LoggingComposable(name: String) {
    SideEffect {
        Log.d("Composition", "$name recomposed")
    }
    Text(name)
}
```

#### produceState

Converts non-State objects to State.

```kotlin
@Composable
fun UserInfo(userId: String) {
    val user by produceState<User?>(initialValue = null, key1 = userId) {
        value = repository.getUser(userId)
    }
    
    user?.let {
        Text("Hello, ${it.name}")
    }
}
```

#### derivedStateOf

Derives state from other state objects (performance optimization).

```kotlin
@Composable
fun EfficientList(lazyListState: LazyListState) {
    val isAtTop by remember {
        derivedStateOf { lazyListState.firstVisibleItemIndex == 0 }
    }
    // Recomposition only when isAtTop actually changes
}
```

---

## Layouts and UI Building Blocks

### Basic Layouts

#### Column

Arranges children vertically.

```kotlin
@Composable
fun VerticalLayout() {
    Column {
        Text("First item")
        Text("Second item")
        Text("Third item")
    }
}
```

**Column Parameters:**
- `modifier`: Modifier for spacing, padding, etc.
- `verticalArrangement`: vertical arrangement of children
- `horizontalAlignment`: horizontal alignment of children

```kotlin
Column(
    modifier = Modifier.padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp),
    horizontalAlignment = Alignment.CenterHorizontally
) {
    // children
}
```

#### Row

Arranges children horizontally.

```kotlin
@Composable
fun HorizontalLayout() {
    Row {
        Text("Left")
        Text("Right")
    }
}
```

**Row Parameters:**
- `modifier`: Layout modifications
- `horizontalArrangement`: Spacing between items
- `verticalAlignment`: Vertical positioning

#### Box

Stacks children on top of each other.

```kotlin
@Composable
fun StackLayout() {
    Box {
        Image(painter = painterResource(R.drawable.bg), contentDescription = null)
        Text("Overlay text", modifier = Modifier.align(Alignment.Center))
    }
}
```

### ConstraintLayout

For complex layouts with positioning rules.

```kotlin
@Composable
fun ConstraintLayoutContent() {
    ConstraintLayout {
        val (button, text, image) = createRefs()
        
        Button(
            onClick = { /* ... */ },
            modifier = Modifier.constrainAs(button) {
                top.linkTo(parent.top, margin = 16.dp)
            }
        ) {
            Text("Button")
        }
        
        Text("Text", Modifier.constrainAs(text) {
            top.linkTo(button.bottom, margin = 16.dp)
            centerHorizontallyTo(parent)
        })
        
        Image(
            painter = painterResource(R.drawable.image),
            contentDescription = null,
            modifier = Modifier.constrainAs(image) {
                top.linkTo(text.bottom, margin = 16.dp)
            }
        )
    }
}
```

### Lazy Layouts

#### LazyColumn

For long vertical lists (recycles items like RecyclerView).

```kotlin
@Composable
fun LargeList() {
    LazyColumn {
        items(100) { index ->
            Text("Item: $index")
        }
    }
}

// With data items
@Composable
fun MessageList(messages: List<Message>) {
    LazyColumn {
        items(messages) { message ->
            MessageCard(message)
        }
    }
}
```

#### LazyRow

For horizontal scrolling lists.

```kotlin
@Composable
fun HorizontalImageList(images: List<Image>) {
    LazyRow {
        items(images) { image ->
            ImageCard(image)
        }
    }
}
```

#### LazyVerticalGrid / LazyHorizontalGrid

For grid layouts.

```kotlin
@Composable
fun PhotoGrid(photos: List<Photo>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3)
    ) {
        items(photos) { photo ->
            PhotoItem(photo)
        }
    }
}
```

### Material Design Components

#### Button

```kotlin
@Composable
fun ButtonExamples() {
    // Standard button
    Button(onClick = { /* ... */ }) {
        Text("Click me")
    }
    
    // Outlined button
    OutlinedButton(onClick = { /* ... */ }) {
        Text("Outline")
    }
    
    // Text button
    TextButton(onClick = { /* ... */ }) {
        Text("Text button")
    }
    
    // Elevated button
    ElevatedButton(onClick = { /* ... */ }) {
        Text("Elevated")
    }
}
```

#### TextField

```kotlin
@Composable
fun TextFieldExamples() {
    var text by remember { mutableStateOf("") }
    
    // Standard text field
    TextField(
        value = text,
        onValueChange = { text = it },
        label = { Text("Label") }
    )
    
    // Outlined text field
    OutlinedTextField(
        value = text,
        onValueChange = { text = it },
        label = { Text("Label") },
        placeholder = { Text("Placeholder") }
    )
}
```

#### Card

```kotlin
@Composable
fun CardExample() {
    Card(
        modifier = Modifier.padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text("Card title", style = MaterialTheme.typography.headlineSmall)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Card content goes here")
        }
    }
}
```

#### Scaffold

Provides a basic Material Design layout structure.

```kotlin
@Composable
fun MyScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My App") }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { /* ... */ }) {
                Icon(Icons.Default.Add, contentDescription = "Add")
            }
        }
    ) { paddingValues ->
        // Content goes here, respecting paddingValues
        Content(modifier = Modifier.padding(paddingValues))
    }
}
```

### Modifiers

Modifiers decorate or augment composable behavior.

#### Common Modifiers

```kotlin
Modifier
    .fillMaxWidth()                    // Fill maximum width
    .fillMaxHeight()                   // Fill maximum height
    .fillMaxSize()                     // Fill entire available space
    .width(200.dp)                     // Fixed width
    .height(100.dp)                    // Fixed height
    .size(200.dp)                     // Fixed size
    .size(width = 200.dp, height = 100.dp)
    .padding(16.dp)                    // Padding
    .padding(start = 8.dp, end = 8.dp)
    .background(Color.Blue)            // Background color
    .border(2.dp, Color.Black)        // Border
    .clip(shape)                       // Clip to shape
    .alpha(0.5f)                       // Transparency
    .clickable { /* ... */ }           // Click listener
    .paddingFromBaseline(32.dp)        // Padding from text baseline
```

#### Advanced Modifiers

```kotlin
// Layout weight
Modifier.weight(1f)

// Vertical/horizontal scrolling
Modifier.verticalScroll(rememberScrollState())
Modifier.horizontalScroll(rememberScrollState())

// Drawing modifiers
Modifier.drawBehind { /* canvas draw */ }
Modifier.drawWithContent { /* custom drawing */ }

// Graphics modifiers
Modifier.graphicsLayer {
    alpha = 0.5f
    rotationZ = 45f
    scaleX = 1.5f
    scaleY = 1.5f
}

// Z-index
Modifier.zIndex(1f)

// Offset
Modifier.offset(x = 10.dp, y = 20.dp)
```

### Custom Layouts

#### Intrinsic Measurements

```kotlin
@Composable
fun TwoTexts(
    modifier: Modifier = Modifier,
    text1: String,
    text2: String
) {
    Row(modifier = modifier) {
        Text(
            text = text1,
            modifier = Modifier
                .weight(1f)
                .padding(start = 4.dp)
                .wrapContentWidth(Alignment.Start)
        )
        Divider(
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.fillMaxHeight().width(1.dp)
        )
        Text(
            text = text2,
            modifier = Modifier
                .weight(1f)
                .padding(end = 4.dp)
                .wrapContentWidth(Alignment.End)
        )
    }
}
```

#### Custom Layout Function

```kotlin
@Composable
fun CustomLayout(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Layout(
        modifier = modifier,
        content = content
    ) { measurables, constraints ->
        // Measure children
        val placeables = measurables.map { measurable ->
            measurable.measure(constraints)
        }
        
        // Calculate layout size
        val width = placeables.maxOf { it.width }
        val height = placeables.sumOf { it.height }
        
        // Position children
        layout(width, height) {
            var yPosition = 0
            placeables.forEach { placeable ->
                placeable.placeRelative(x = 0, y = yPosition)
                yPosition += placeable.height
            }
        }
    }
}
```

---

## State and Data Flow

### State in Compose

#### State and MutableState

```kotlin
@Composable
fun StateExamples() {
    // Simple state
    var name by remember { mutableStateOf("") }
    
    // State with validation
    var email by remember { mutableStateOf("") }
    val isValidEmail by remember {
        derivedStateOf { 
            email.contains("@") && email.contains(".") 
        }
    }
    
    // Multiple related states
    val (firstName, setFirstName) = remember { mutableStateOf("") }
    val (lastName, setLastName) = remember { mutableStateOf("") }
}
```

#### ViewModel Integration

```kotlin
class MyViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    data class UiState(
        val loading: Boolean = false,
        val data: List<Item> = emptyList(),
        val error: String? = null
    )
}

@Composable
fun MyScreen(viewModel: MyViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    
    when {
        uiState.loading -> LoadingScreen()
        uiState.error != null -> ErrorScreen(uiState.error!!)
        else -> ContentScreen(uiState.data)
    }
}
```

### Unidirectional Data Flow (UDF)

**Principle**: State flows down, events flow up

```kotlin
// State holder
class MyScreenStateHolder(
    initialItems: List<Item> = emptyList()
) {
    var items by mutableStateOf(initialItems)
        private set
    
    fun addItem(item: Item) {
        items = items + item
    }
    
    fun removeItem(item: Item) {
        items = items - item
    }
}

// Stateless composable
@Composable
fun MyScreen(
    items: List<Item>,
    onAddItem: (Item) -> Unit,
    onRemoveItem: (Item) -> Unit
) {
    Column {
        ItemsList(
            items = items,
            onRemoveItem = onRemoveItem
        )
        AddItemButton(onAddItem = onAddItem)
    }
}

// Stateful wrapper
@Composable
fun MyScreenStateful() {
    val stateHolder = remember { MyScreenStateHolder() }
    
    MyScreen(
        items = stateHolder.items,
        onAddItem = stateHolder::addItem,
        onRemoveItem = stateHolder::removeItem
    )
}
```

### Managing Different Types of State

#### UI State

```kotlin
data class ArticleUiState(
    val isLoading: Boolean = false,
    val article: Article? = null,
    val isFavorite: Boolean = false,
    val errorMessages: List<String> = emptyList()
)

@Composable
fun ArticleScreen(articleId: String, viewModel: ArticleViewModel = viewModel()) {
    val uiState = viewModel.uiState.collectAsState()
    
    ArticleContent(
        uiState = uiState,
        onFavoriteClick = viewModel::toggleFavorite,
        onRefresh = viewModel::refreshArticle
    )
}
```

#### Screen UI State

```kotlin
sealed interface MyScreenUiState {
    object Loading : MyScreenUiState
    data class Success(val data: List<Item>) : MyScreenUiState
    data class Error(val message: String) : MyScreenUiState
}

@Composable
fun MyScreen(uiState: MyScreenUiState) {
    when (uiState) {
        is MyScreenUiState.Loading -> LoadingIndicator()
        is MyScreenUiState.Success -> ItemsList(uiState.data)
        is MyScreenUiState.Error -> ErrorMessage(uiState.message)
    }
}
```

#### UI Element State

```kotlin
@Composable
fun ExpandableCard() {
    var isExpanded by rememberSaveable { mutableStateOf(false) }
    
    Card {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Card Title")
                IconButton(onClick = { isExpanded = !isExpanded }) {
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (isExpanded) "Show less" else "Show more"
                    )
                }
            }
            if (isExpanded) {
                Text("Expanded content goes here")
            }
        }
    }
}
```

### CompositionLocal

For passing data implicitly through the composition tree.

```kotlin
val LocalElevations = compositionLocalOf { Elevations() }

data class Elevations(
    val default: Dp = 0.dp,
    val pressed: Dp = 8.dp
)

@Composable
fun ProvideElevations(elevations: Elevations, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalElevations provides elevations) {
        content()
    }
}

@Composable
fun MyCard() {
    val elevations = LocalElevations.current
    Card(elevation = CardDefaults.cardElevation(defaultElevation = elevations.default)) {
        Text("Card with custom elevation")
    }
}
```

---

## Design System and Theming

### Material 3 Theming

#### Color Schemes

```kotlin
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.MaterialTheme

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6200EE),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE8DDFF),
    onPrimaryContainer = Color(0xFF23005C),
    secondary = Color(0xFF03DAC6),
    onSecondary = Color.Black,
    // ... define all colors
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFCFBCFF),
    onPrimary = Color(0xFF381E72),
    primaryContainer = Color(0xFF4F378A),
    onPrimaryContainer = Color(0xFFE8DDFF),
    // ... define dark theme colors
)

@Composable
fun MyAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColorScheme else LightColorScheme
    
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
```

#### Typography

```kotlin
import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 45.sp,
        lineHeight = 52.sp
    ),
    // ... define all text styles
)
```

#### Shapes

```kotlin
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val Shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(28.dp)
)
```

### Custom Design System

#### Custom Colors

```kotlin
@Stable
class CustomColors(
    val content: Color,
    val component: Color,
    val border: Color
) {
    companion object {
        @Composable
        fun light() = CustomColors(
            content = Color.Black,
            component = Color.White,
            border = Color.Gray
        )
        
        @Composable
        fun dark() = CustomColors(
            content = Color.White,
            component = Color.DarkGray,
            border = Color.LightGray
        )
    }
}

val LocalCustomColors = compositionLocalOf { CustomColors.light() }

@Composable
fun ProvideCustomColors(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) CustomColors.dark() else CustomColors.light()
    CompositionLocalProvider(LocalCustomColors provides colors) {
        content()
    }
}

@Composable
fun CustomThemedCard() {
    val colors = LocalCustomColors.current
    Card(
        colors = CardDefaults.cardColors(
            containerColor = colors.component,
            contentColor = colors.content
        )
    ) {
        Text("Custom themed content")
    }
}
```

#### Custom Themes with Material You

```kotlin
@Composable
fun DynamicTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val dynamicColor = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    
    val colors = when {
        dynamicColor && darkTheme -> dynamicDarkColorScheme(context)
        dynamicColor && !darkTheme -> dynamicLightColorScheme(context)
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        content = content
    )
}
```

### Custom Component Styles

```kotlin
@Composable
fun CustomButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
        ),
        shape = MaterialTheme.shapes.medium,
        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp),
        content = content
    )
}
```

---

## Navigation

### Navigation Component for Compose

#### Setup

```gradle
dependencies {
    implementation "androidx.navigation:navigation-compose:2.7.7"
}
```

#### Navigation Host

```kotlin
@Composable
fun MyApp() {
    val navController = rememberNavController()
    
    NavHost(navController = navController, startDestination = "home") {
        composable("home") { HomeScreen(navController) }
        composable("details/{itemId}") { backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId")
            DetailsScreen(navController, itemId)
        }
        composable("settings") { SettingsScreen(navController) }
    }
}
```

#### Navigation and Arguments

```kotlin
// Navigate without arguments
navController.navigate("details")

// Navigate with arguments
navController.navigate("details/${item.id}")

// Navigate with options
navController.navigate("details") {
    popUpTo("home") { inclusive = true }
    launchSingleTop = true
}

// Navigate back
navController.navigateUp()
navController.popBackStack()
```

#### Passing Data Between Destinations

```kotlin
// Using route parameters
composable(
    "profile/{userId}",
    arguments = listOf(navArgument("userId") { type = NavType.StringType })
) { backStackEntry ->
    val userId = backStackEntry.arguments?.getString("userId")
    ProfileScreen(userId = userId)
}

// Using optional arguments
composable(
    "profile?userId={userId}",
    arguments = listOf(navArgument("userId") { defaultValue = "me" })
) { backStackEntry ->
    val userId = backStackEntry.arguments?.getString("userId")
    ProfileScreen(userId = userId)
}
```

#### Deep Links

```kotlin
composable(
    "details/{itemId}",
    deepLinks = listOf(
        navDeepLink {
            uriPattern = "android-app://example.com/details/{itemId}"
        }
    )
) { backStackEntry ->
    DetailsScreen(itemId = backStackEntry.arguments?.getString("itemId"))
}
```

#### Nested Navigation

```kotlin
NavHost(navController, startDestination = "home") {
    navigation(startDestination = "home", route = "main") {
        composable("home") { HomeScreen() }
        composable("list") { ListScreen() }
    }
    navigation(startDestination = "profile", route = "user") {
        composable("profile") { ProfileScreen() }
        composable("settings") { SettingsScreen() }
    }
}
```

### Bottom Navigation

```kotlin
@Composable
fun BottomNavigationBar(navController: NavController) {
    val items = listOf("home", "search", "profile")
    
    BottomNavigation {
        val currentRoute = currentRoute(navController)
        
        items.forEach { screen ->
            BottomNavigationItem(
                icon = { Icon(Icons.Default.Home, contentDescription = null) },
                label = { Text(screen) },
                selected = currentRoute == screen,
                onClick = {
                    navController.navigate(screen) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}

@Composable
private fun currentRoute(navController: NavController): String? {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    return navBackStackEntry?.destination?.route
}
```

### Navigation Drawer

```kotlin
@Composable
fun DrawerScreen() {
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    
    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Text("Drawer title", modifier = Modifier.padding(16.dp))
                Divider()
                NavigationDrawerItem(
                    label = { Text("Home") },
                    selected = false,
                    onClick = { scope.launch { drawerState.close() } }
                )
                NavigationDrawerItem(
                    label = { Text("Settings") },
                    selected = false,
                    onClick = { scope.launch { drawerState.close() } }
                )
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("App") },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
                        }
                    }
                )
            }
        ) { paddingValues ->
            Content(modifier = Modifier.padding(paddingValues))
        }
    }
}
```

### Bottom Sheet Navigation

```kotlin
@Composable
fun BottomSheetNavigation() {
    val bottomSheetNavigator = rememberBottomSheetNavigator()
    navController = rememberNavController(bottomSheetNavigator)
    
    ModalBottomSheetLayout(bottomSheetNavigator) {
        NavHost(navController, startDestination = "home") {
            composable("home") { HomeScreen(navController) }
            bottomSheet("sheet") { BottomSheetContent() }
        }
    }
}
```

---

## Animation and Graphics

### Animation APIs

#### animate*AsState

For simple state-based animations.

```kotlin
@Composable
fun AnimatedVisibilityExample() {
    var visible by remember { mutableStateOf(true) }
    
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0f,
        animationSpec = tween(durationMillis = 300)
    )
    
    Box(
        modifier = Modifier
            .alpha(alpha)
            .size(100.dp)
            .background(Color.Blue)
    )
}
```

#### AnimatedVisibility

Automatically animates content appearance/disappearance.

```kotlin
@Composable
fun ExpandableCard() {
    var expanded by remember { mutableStateOf(false) }
    
    Column {
        Button(onClick = { expanded = !expanded }) {
            Text(if (expanded) "Show less" else "Show more")
        }
        
        AnimatedVisibility(visible = expanded) {
            Text(
                "This content appears/disappears with animation",
                modifier = Modifier.padding(16.dp)
            )
        }
    }
}

// With custom animation specs
AnimatedVisibility(
    visible = expanded,
    enter = slideInVertically() + fadeIn(),
    exit = slideOutVertically() + fadeOut()
) {
    Text("Custom animated content")
}
```

#### animateContentSize

Animates size changes.

```kotlin
@Composable
fun ExpandingText() {
    var expanded by remember { mutableStateOf(false) }
    
    Box(
        modifier = Modifier
            .background(Color.LightGray)
            .animateContentSize()
            .clickable { expanded = !expanded }
    ) {
        Text(
            text = if (expanded) "Lorem ipsum dolor sit amet." else "Short",
            modifier = Modifier.padding(16.dp)
        )
    }
}
```

### Advanced Animations

#### Transition

For multiple related animations.

```kotlin
@Composable
fun TransitionExample() {
    var expanded by remember { mutableStateOf(false) }
    
    val transition = updateTransition(targetState = expanded, label = "expand")
    
    val size by transition.animateDp(label = "size") { isExpanded ->
        if (isExpanded) 200.dp else 100.dp
    }
    
    val cornerRadius by transition.animateDp(label = "corner") { isExpanded ->
        if (isExpanded) 0.dp else 8.dp
    }
    
    Box(
        modifier = Modifier
            .size(size)
            .clip(RoundedCornerShape(cornerRadius))
            .background(Color.Blue)
            .clickable { expanded = !expanded }
    )
}
```

#### Animatable

For more control over animations.

```kotlin
@Composable
fun AnimatableExample() {
    var enabled by remember { mutableStateOf(false) }
    val color = remember { Animatable(Color.Gray) }
    
    LaunchedEffect(enabled) {
        color.animateTo(
            targetValue = if (enabled) Color.Green else Color.Gray,
            animationSpec = spring(stiffness = Spring.StiffnessLow)
        )
    }
    
    Box(
        modifier = Modifier
            .size(100.dp)
            .background(color.value)
            .clickable { enabled = !enabled }
    )
}
```

#### Infinite Animation

```kotlin
@Composable
fun InfiniteRotation() {
    val infiniteTransition = rememberInfiniteTransition()
    
    val angle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing)
        )
    )
    
    Box(
        modifier = Modifier
            .size(100.dp)
            .graphicsLayer { rotationZ = angle }
            .background(Color.Blue)
    )
}
```

#### Gesture Animation

```kotlin
@Composable
fun DraggableCard() {
    val offsetX = remember { Animatable(0f) }
    val offsetY = remember { Animatable(0f) }
    
    Box(
        modifier = Modifier
            .offset { IntOffset(offsetX.value.toInt(), offsetY.value.toInt()) }
            .draggable(
                orientation = Orientation.Horizontal,
                state = rememberDraggableState { delta ->
                    scope.launch {
                        offsetX.snapTo(offsetX.value + delta)
                    }
                }
            )
            .background(Color.Blue)
            .size(100.dp)
    )
}
```

### Graphics

#### Canvas

```kotlin
@Composable
fun CanvasExample() {
    Canvas(modifier = Modifier.size(200.dp)) {
        // Draw circle
        drawCircle(
            color = Color.Blue,
            center = center,
            radius = 100f
        )
        
        // Draw line
        drawLine(
            color = Color.Red,
            start = Offset.Zero,
            end = Offset(size.width, size.height),
            strokeWidth = 5f
        )
        
        // Draw rectangle
        drawRect(
            color = Color.Green,
            topLeft = Offset(50f, 50f),
            size = Size(100f, 100f)
        )
    }
}
```

#### Custom Drawing with Modifier.drawBehind

```kotlin
@Composable
fun CustomBackground() {
    Text(
        text = "Text with custom background",
        modifier = Modifier
            .drawWithContent {
                drawRect(
                    color = Color.LightGray,
                    size = Size(size.width, size.height * 0.5f)
                )
                drawContent()
            }
            .padding(16.dp)
    )
}
```

#### Path Drawing

```kotlin
@Composable
fun PathExample() {
    Canvas(modifier = Modifier.size(200.dp)) {
        val path = Path().apply {
            moveTo(size.width / 2, 0f)
            lineTo(size.width, size.height)
            lineTo(0f, size.height)
            close()
        }
        
        drawPath(
            path = path,
            color = Color.Magenta
        )
    }
}
```

#### Gradient

```kotlin
@Composable
fun GradientExample() {
    Canvas(modifier = Modifier.size(200.dp)) {
        val gradient = Brush.linearGradient(
            colors = listOf(Color.Red, Color.Blue, Color.Green),
            start = Offset.Zero,
            end = Offset(size.width, size.height)
        )
        
        drawRect(
            brush = gradient,
            size = size
        )
    }
}
```

---

## Resource Management

### Strings

```kotlin
// In res/values/strings.xml
/*
<resources>
    <string name="app_name">My App</string>
    <string name="welcome_message">Welcome %1$s</string>
</resources>
*/

@Composable
fun StringExample(name: String) {
    // Simple string
    Text(stringResource(R.string.app_name))
    
    // String with format arguments
    Text(stringResource(R.string.welcome_message, name))
    
    // Plurals
    Text(pluralStringResource(R.plurals.items, count, count))
}
```

### Colors

```kotlin
// In res/values/colors.xml
/*
<resources>
    <color name="brand_primary">#FF6200EE</color>
</resources>
*/

@Composable
fun ColorExample() {
    Box(
        modifier = Modifier.background(colorResource(R.color.brand_primary))
    )
}
```

### Dimensions

```kotlin
// In res/values/dimens.xml
/*
<resources>
    <dimen name="padding_large">24dp</dimen>
</resources>
*/

@Composable
fun DimensionExample() {
    Spacer(modifier = Modifier.height(dimensionResource(R.dimen.padding_large)))
}
```

### Images

```kotlin
// Vector drawable
Icon(
    painter = painterResource(R.drawable.ic_home),
    contentDescription = "Home"
)

// Bitmap image
Image(
    painter = painterResource(R.drawable.header_image),
    contentDescription = "Header image",
    modifier = Modifier.fillMaxWidth()
)

// Loading images with Coil
/*
implementation "io.coil-kt:coil-compose:2.4.0"
*/

@Composable
fun NetworkImage(url: String) {
    AsyncImage(
        model = url,
        contentDescription = "Network image",
        placeholder = painterResource(R.drawable.placeholder),
        error = painterResource(R.drawable.error)
    )
}
```

---

## Interoperability

### Using Views in Compose

#### AndroidView

```kotlin
@Composable
fun WebViewScreen(url: String) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                loadUrl(url)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
```

#### AndroidViewBinding

```kotlin
@Composable
fun ViewBindingExample() {
    AndroidViewBinding(ExampleLayoutBinding::inflate) {
        // Access views through binding
        titleText.text = "Hello"
        subtitleText.text = "From View Binding"
    }
}
```

#### AdView (Ads)

```kotlin
@Composable
fun AdMobBanner() {
    AndroidView(
        factory = { context ->
            AdView(context).apply {
                setAdSize(AdSize.BANNER)
                adUnitId = "ca-app-pub-3940256099942544/6300978111"
                loadAd(AdRequest.Builder().build())
            }
        }
    )
}
```

### Using Compose in Views

#### ComposeView in XML

```xml
<!-- In res/layout/activity_main.xml -->
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent",
    android:layout_height="match_parent">
    
    <androidx.compose.ui.platform.ComposeView
        android:id="@+id/compose_view"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</FrameLayout>
```

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        findViewById<ComposeView>(R.id.compose_view).setContent {
            MaterialTheme {
                MyComposeContent()
            }
        }
    }
}
```

#### ComposeView in Fragments

```kotlin
class MyFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            setContent {
                MaterialTheme {
                    FragmentContent()
                }
            }
        }
    }
}
```

### Sharing ViewModel Between Compose and Views

```kotlin
class SharedViewModel : ViewModel() {
    val data = MutableLiveData<String>()
}

// In View-based fragment
class LegacyFragment : Fragment() {
    private val viewModel: SharedViewModel by activityViewModels()
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.data.observe(viewLifecycleOwner) { /* ... */ }
    }
}

// In Compose
@Composable
fun ComposeScreen(viewModel: SharedViewModel = viewModel()) {
    val data by viewModel.data.observeAsState()
    Text(data ?: "No data")
}
```

---

## Performance and Optimization

### Best Practices

#### 1. Remember State

```kotlin
// Bad: Creates new list on every recomposition
@Composable
fun BadExample() {
    val items = List(100) { "Item $it" }  // This runs on every recomposition
    LazyColumn {
        items(items) { ItemRow(it) }
    }
}

// Good: Remember the list
@Composable
fun GoodExample() {
    val items = remember { List(100) { "Item $it" } }
    LazyColumn {
        items(items) { ItemRow(it) }
    }
}
```

#### 2. Stable Types

```kotlin
// Bad: Unstable class (var properties)
data class BadItem(var name: String, var selected: Boolean)

// Good: Stable class (val properties)
data class GoodItem(val name: String, val selected: Boolean)
```

#### 3. Lambda Stability

```kotlin
// Bad: New lambda on each recomposition
@Composable
fun BadList(items: List<Item>) {
    LazyColumn {
        items(items) { item ->
            ItemRow(item, onClick = { println(item.id) })
        }
    }
}

// Good: Stable lambda
@Composable
fun GoodList(items: List<Item>) {
    LazyColumn {
        items(items, key = { it.id }) { item ->
            val onClick = remember(item) { { println(item.id) } }
            ItemRow(item, onClick = onClick)
        }
    }
}
```

#### 4. Key in Lists

```kotlin
@Composable
fun EfficientList(users: List<User>) {
    LazyColumn {
        items(
            items = users,
            key = { user -> user.id }  // Stable keys for performance
        ) { user ->
            UserRow(user)
        }
    }
}
```

#### 5. Use Lazy Layouts for Large Lists

```kotlin
// Bad: Column with 1000 items - poor performance
@Composable
fun BadLargeList() {
    Column {
        repeat(1000) {
            ItemRow("Item $it")
        }
    }
}

// Good: LazyColumn recycles items
@Composable
fun GoodLargeList() {
    LazyColumn {
        items(1000) {
            ItemRow("Item $it")
        }
    }
}
```

### Avoid Common Pitfalls

#### 1. Don't Read State During Composition That Changes Frequently

```kotlin
// Bad: Read currentTime every frame
@Composable
fun BadClock() {
    var currentTime = System.currentTimeMillis()  // Changes constantly
    Text(currentTime.toString())
}

// Good: Use LaunchedEffect to update periodically
@Composable
fun GoodClock() {
    var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }
    
    LaunchedEffect(Unit) {
        while (true) {
            currentTime = System.currentTimeMillis()
            delay(1000)
        }
    }
    
    Text(currentTime.toString())
}
```

#### 2. Don't Do Heavy Work in Composition

```kotlin
// Bad: Heavy filtering on each recomposition
@Composable
fun BadExample(items: List<Item>) {
    val filtered = items.filter { it.name.length > 10 }.sortedBy { it.name }
    LazyColumn { items(filtered) { ItemRow(it) } }
}

// Good: Remember the filtered result
@Composable
fun GoodExample(items: List<Item>) {
    val filtered = remember(items) {
        items.filter { it.name.length > 10 }.sortedBy { it.name }
    }
    LazyColumn { items(filtered) { ItemRow(it) } }
}
```

#### 3. Optimize Recomposition Scope

```kotlin
// Bad: Whole screen recomposes when count changes
@Composable
fun BadScreen() {
    var count by remember { mutableStateOf(0) }
    
    Column {
        Text("Header")
        Text("Count: $count")  // This change recomposes entire Column
        Text("Footer")
    }
}

// Good: Only CountText recomposes
@Composable
fun GoodScreen() {
    Column {
        Text("Header")
        CountText()
        Text("Footer")
    }
}

@Composable
fun CountText() {
    var count by remember { mutableStateOf(0) }
    Text("Count: $count")
}
```

### Profiling

#### Compose Compiler Metrics

Enable in build.gradle:

```gradle
android {
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
        kotlinCompilerArgs += [
            "-P",
            "plugin:androidx.compose.compiler.plugins.kotlin:metricsDestination=" +
                    project.buildDir.absolutePath + "/compose_metrics"
        ]
    }
}
```

### @Stable, @Immutable, @ImmutableCollection

```kotlin
@Stable
interface UiState<T> {
    val value: T
    val exception: Throwable?
}

@Immutable
data class User(val name: String, val age: Int)
```

---

## Testing

### Testing Setup

```gradle
dependencies {
    testImplementation "junit:junit:4.13.2"
    androidTestImplementation "androidx.test.ext:junit:1.1.5"
    androidTestImplementation "androidx.test.espresso:espresso-core:3.5.1"
    
    // Compose testing
    androidTestImplementation "androidx.compose.ui:ui-test-junit4:1.6.0"
    debugImplementation "androidx.compose.ui:ui-test-manifest:1.6.0"
}
```

### Unit Testing

```kotlin
class ViewModelTest {
    @Test
    fun `when data loaded, ui state is success`() = runTest {
        // Given
        val repository = mock<Repository>()
        whenever(repository.getData()).thenReturn(Result.success(listOf(Item())))
        val viewModel = MyViewModel(repository)
        
        // When
        viewModel.loadData()
        
        // Then
        assertEquals(UiState.Success(listOf(Item())), viewModel.uiState.value)
    }
}
```

### UI Testing

```kotlin
class ComposeTest {
    @get:Rule
    val composeTestRule = createComposeRule()
    
    @Test
    fun myTest() {
        // Start the app
        composeTestRule.setContent {
            MyApp()
        }
        
        // Find and interact with UI elements
        composeTestRule.onNodeWithText("Click me").performClick()
        
        // Verify assertions
        composeTestRule.onNodeWithText("Count: 1").assertIsDisplayed()
    }
}
```

**Finding Nodes:**

```kotlin
// By text
onNodeWithText("Hello")
onNodeWithText("Hello", substring = true)

// By content description
onNodeWithContentDescription("Back")

// By tag
onNodeWithTag("my-tag")

// By semantics property
onNode(hasClickAction())
onNode(hasText("Hello"))

// Combined matchers
onNode(
    hasText("Hello") and hasClickAction()
)
```

**Assertions:**

```kotlin
// Exists
assertExists()
assertDoesNotExist()

// Visibility
assertIsDisplayed()
assertIsNotDisplayed()
assertIsEnabled()
assertIsNotEnabled()

// Text
assertTextEquals("Exact text")
assertTextContains("Partial")

// Content description
assertContentDescriptionEquals("Description")
```

**Actions:**

```kotlin
// Click
performClick()
performImeAction()  // IME action like "Done"

// Text input
performTextClear()
performTextInput("hello")
performTextReplacement("new text")

// Gestures
performTouchInput {
    swipeDown(centerY, centerY + 200)
    swipeUp()
    swipeLeft()
    swipeRight()
}
```

**Synchronization:**

```kotlin
// Wait for condition
waitUntil {
    composeTestRule.onNodeWithText("Loaded").isDisplayed()
}

waitUntil(timeoutMillis = 1000) {
    composeTestRule.onNodeWithTag("loading").doesNotExist()
}
```

**Testing Lists:**

```kotlin
// Perform scroll action
composeTestRule.onNodeWithTag("list")
    .performScrollToIndex(99)

// Scroll to node with text
composeTestRule.onNodeWithTag("list")
    .performScrollToNode(hasText("Item 50"))

// Assert first item
createComposeRule().onNodeWithTag("list")
    .onChildren()[0]
    .assert(hasText("Item 0"))
```

**Screenshot Testing:**

```kotlin
@Test
fun screenshotTest() {
    composeTestRule.setContent {
        MyScreen()
    }
    
    composeTestRule.onRoot().captureToImage()
        .assertAgainstGolden()
}
```

### Testing Navigation

```kotlin
@Test
fun navigationTest() {
    // Given
    composeTestRule.setContent { MyApp() }
    
    // When
    composeTestRule.onNodeWithText("Go to details").performClick()
    
    // Then
    composeTestRule.onNodeWithText("Details screen").assertIsDisplayed()
}
```

### Testing ViewModel with Compose

```kotlin
@Test
fun composeWithViewModelTest() {
    // Given
    val fakeRepository = FakeRepository()
    val viewModel = MyViewModel(fakeRepository)
    
    composeTestRule.setContent {
        MyScreen(viewModel = viewModel)
    }
    
    // When
    composeTestRule.onNodeWithText("Load").performClick()
    
    // Then
    composeTestRule.onNodeWithText("Item 1").assertIsDisplayed()
}
```

---

## Accessibility

### Content Descriptions

```kotlin
// For images
Icon(
    imageVector = Icons.Default.Close,
    contentDescription = "Close dialog"
)

// For decorative images
Icon(
    painter = painterResource(R.drawable.decoration),
    contentDescription = null  // Decorative, no description needed
)

// For complex images
Canvas(
    modifier = Modifier.semantics {
        contentDescription = "Chart showing growth from 10 to 100"
    }
) { /* ... */ }
```

### Merge and Clear Semantics

```kotlin
// Merge children semantics
Row(
    modifier = Modifier.semantics(mergeDescendants = true) {}
) {
    Icon(Icons.Default.Account, contentDescription = null)
    Text("Profile")
    Icon(Icons.Default.ArrowForward, contentDescription = null)
}
// Screen reader reads: "Profile" (merged into one element)

// Clear semantics
Divider(
    modifier = Modifier.clearAndSetSemantics { }
)
// Screen reader ignores this element
```

### Custom Actions

```kotlin
@Composable
fun CustomActionExample() {
    var count by remember { mutableStateOf(0) }
    
    Box(
        modifier = Modifier
            .semantics {
                customActions = listOf(
                    CustomAction("Increment") { count++ },
                    CustomAction("Decrement") { count-- }
                )
            }
            .size(100.dp)
            .background(Color.Blue)
    ) {
        Text("Count: $count", color = Color.White)
    }
}
```

### Focus Management

```kotlin
@Composable
fun FocusExample() {
    val focusRequester = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    
    TextField(
        value = text,
        onValueChange = { text = it },
        modifier = Modifier.focusRequester(focusRequester)
    )
    
    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }
    
    Button(onClick = { focusManager.clearFocus() }) {
        Text("Clear focus")
    }
}
```

### Accessibility Properties

```kotlin
@Composable
fun AccessibleButton() {
    Button(
        onClick = { /* ... */ },
        modifier = Modifier.semantics {
            disabled()
            stateDescription = "Loading data"
        }
    ) {
        Text("Load data")
    }
}
```

### Font Scaling

```kotlin
@Composable
fun ResponsiveText() {
    // Compose automatically respects font scale from system settings
    Text(
        "This text scales with system font size",
        style = MaterialTheme.typography.bodyLarge
    )
}
```

---

## Advanced Topics

### Window Insets

```kotlin
// Enable in theme
@Composable
fun MyAppTheme(content: @Composable () -> Unit) {
    MaterialTheme {
        ProvideWindowInsets {
            content()
        }
    }
}

// Use insets
@Composable
fun InsetAwareFab() {
    val insets = LocalWindowInsets.current
    val imeVisible = insets.ime.isVisible
    
    FloatingActionButton(
        modifier = Modifier
            .padding(
                bottom = if (imeVisible) insets.ime.bottom.dp else 16.dp
            ),
        onClick = { /* ... */ }
    ) {
        Icon(Icons.Default.Add, contentDescription = "Add")
    }
}
```

### Multiple Windows Support

```kotlin
@Composable
fun MultiWindowApp(activity: Activity) {
    val windowSize = with(LocalDensity.current) {
        activity.window.decorView.width.toDp()
    }
    
    when {
        windowSize < 600.dp -> CompactLayout()
        windowSize < 840.dp -> MediumLayout()
        else -> ExpandedLayout()
    }
}
```

### Multi-Module Apps

```kotlin
// In :feature:home module
@Composable
fun HomeScreen(
    onNavigateToDetail: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Feature-specific UI
}

// In :app module
@Composable
fun MyApp() {
    NavHost(navController, startDestination = "home") {
        composable("home") {
            HomeScreen(onNavigateToDetail = { id ->
                navController.navigate("detail/$id")
            })
        }
    }
}
```

### Building Libraries

```kotlin
// Public API for library
@Composable
fun MyLibraryComponent(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    // Implementation
}

// Internal implementation
data class InternalState(/* ... */)
```

### Performance Optimization for Large Apps

```kotlin
// Use composition local for dependencies
val LocalDependencies = compositionLocalOf { Dependencies() }

// Use derivedStateOf for expensive calculations
@Composable
fun OptimizedList(items: List<Item>) {
    val filteredItems by remember(items) {
        derivedStateOf {
            items.filter { it.isActive }.sortedBy { it.priority }
        }
    }
    
    LazyColumn {
        items(filteredItems, key = { it.id }) { item ->
            ItemRow(item)
        }
    }
}
```

### State Restoration

```kotlin
@Composable
fun StateRestorationExample() {
    var selectedTab by rememberSaveable { mutableStateOf(0) }
    var scrollPosition by rememberSaveable { mutableStateOf(0) }
    
    TabRow(selectedTabIndex = selectedTab) {
        Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
            Text("Tab 1")
        }
        Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
            Text("Tab 2")
        }
    }
    
    LazyColumn(state = rememberLazyListState(scrollPosition)) {
        items(100) { index ->
            Text("Item $index")
        }
    }
}
```

---

## Conclusion

Jetpack Compose represents a paradigm shift in Android UI development, offering a modern, declarative approach that simplifies building responsive and beautiful user interfaces. Key takeaways:

1. **Declarative UI**: Describe what your UI should look like based on state
2. **Composable Functions**: Small, reusable building blocks for UI
3. **State Management**: Clear patterns for managing UI state with UDF
4. **Material Design**: Built-in Material 3 components and theming
5. **Interoperability**: Seamless integration with existing View-based code
6. **Performance**: Smart recomposition and optimization tools

This comprehensive documentation covers the essential concepts and patterns needed to develop professional Android applications with Jetpack Compose. For the most up-to-date information, always reference the official documentation at https://developer.android.com/develop/ui/compose/documentation.