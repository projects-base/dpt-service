import type { Question } from '../../types'
import { block, bonus, java, tldr, ul } from './highlight'

/**
 * Creational patterns — who builds the object, and what they had to know to do it.
 *
 * One file per pattern family, matching the topic the questions attach to. The
 * split is not cosmetic: these three files change for different reasons and get
 * reviewed at different times, so they are separate for the same reason
 * `OrderValidator` is separate from `OrderRepository`.
 */

const TOPIC = 'design--creational'

export const creationalQuestions: Question[] = [
  {
    id: 'pat-singleton',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Implement Singleton safely. Which form would you actually ship, and why?',
    difficulty: 'medium',
    tags: ['patterns', 'creational', 'concurrency'],
    answerHtml:
      tldr(
        'the enum is the safest form; the static holder idiom is the best lazy one. Double-checked locking works but needs <code>volatile</code>.',
      ) +
      block(
        '1. Enum — what Josh Bloch recommends',
        java(`
public enum Config {
    INSTANCE;
    private final Properties props = load();
    public String get(String key) { return props.getProperty(key); }
}`),
      ) +
      `<p>Free serialisation safety, and reflection cannot construct a second one —
       <code>Constructor.newInstance()</code> explicitly rejects enum types. The downside is that it is
       eager and cannot extend a class.</p>` +
      block(
        '2. Static holder — lazy, thread-safe, no locking',
        java(`
public final class Config {
    private Config() {}
    private static class Holder {
        static final Config INSTANCE = new Config();
    }
    public static Config getInstance() { return Holder.INSTANCE; }
}`),
      ) +
      `<p>The JVM guarantees a class is initialised once, lazily, on first use, under a lock it
       manages itself. <code>Holder</code> is not loaded until <code>getInstance()</code> is first
       called — so this is lazy and thread-safe with zero synchronisation in your code.</p>` +
      block(
        '3. Double-checked locking — correct only with volatile',
        java(`
public final class Config {
    // volatile is NOT optional
    private static volatile Config instance;

    public static Config getInstance() {
        if (instance == null) {              // no lock on the hot path
            synchronized (Config.class) {
                if (instance == null) instance = new Config();
            }
        }
        return instance;
    }
}`),
      ) +
      `<p><strong>Why <code>volatile</code>.</strong> <code>new Config()</code> is three steps:
       allocate, run the constructor, assign the reference. The JVM is allowed to reorder the last two.
       Without <code>volatile</code>, another thread can see a non-null <code>instance</code> whose
       constructor has not finished — a fully constructed reference to a half-constructed object.
       <code>volatile</code> forbids that reordering and publishes the writes.</p>` +
      bonus(
        `Then say the part that shows judgement: Singleton is frequently an anti-pattern. It is global
         mutable state, it hides dependencies from the constructor, and it makes tests order-dependent
         because you cannot get a fresh one. In Spring you almost never write any of this — beans are
         singleton-scoped by default, which gives you one instance <em>per container</em> with the
         lifecycle managed and the dependency still injected and therefore still fakeable.`,
      ),
    followUps: [
      {
        q: 'How would you break a non-enum singleton?',
        a: `Three ways. <strong>Reflection</strong> — <code>setAccessible(true)</code> on the private
            constructor; defend by throwing from the constructor if the instance already exists.
            <strong>Serialization</strong> — deserialising makes a second one; defend with
            <code>readResolve()</code> returning the instance. <strong>Two classloaders</strong> — each
            gets its own copy, and there is no defence, which is why "one per JVM" is really "one per
            classloader".`,
      },
      {
        q: 'Is `synchronized` on the whole getInstance method acceptable?',
        a: `It is correct, and it was the standard advice before Java 5. The cost is a lock on every read
            forever to guard a write that happens once. With modern JIT and biased-locking removal it is
            rarely the bottleneck people assume, but the holder idiom is simpler <em>and</em> faster,
            so there is no reason to choose this one.`,
      },
      {
        q: 'Spring singleton vs the GoF singleton — same thing?',
        a: `No, and the distinction is a good one to draw. GoF is one instance per classloader, enforced
            by the class itself, reached through a global static. Spring is one instance per application
            context, enforced by the container, reached by injection. The Spring version keeps the seam:
            you can inject a different implementation in a test. The GoF one removes it.`,
      },
    ],
  },

  {
    id: 'pat-factory',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Factory Method vs Abstract Factory — what is the actual difference?',
    difficulty: 'medium',
    tags: ['patterns', 'creational'],
    answerHtml:
      tldr(
        'Factory Method makes <em>one</em> product and varies by subclass; Abstract Factory makes a <em>family</em> of related products that must match.',
      ) +
      block(
        'Factory Method — one product, chosen by the subclass',
        java(`
abstract class Dialog {
    abstract Button createButton();          // the factory method

    void render() {              // the algorithm is fixed here
        Button b = createButton();
        b.onClick(this::close);
        b.paint();
    }
}

class WindowsDialog extends Dialog {
    Button createButton() { return new WindowsButton(); }
}
class WebDialog extends Dialog {
    Button createButton() { return new HtmlButton(); }
}`),
      ) +
      block(
        'Abstract Factory — a family that must be consistent',
        java(`
// every method returns a member of one family
interface UiFactory {
    Button   createButton();
    Checkbox createCheckbox();
    Menu     createMenu();
}

class WindowsFactory implements UiFactory { /* all Windows* */ }
class MacFactory     implements UiFactory { /* all Mac*     */ }

// The point: you cannot pair a Windows button with a Mac checkbox.
// The factory makes the mismatch unrepresentable.`),
      ) +
      `<p><strong>The distinction in one sentence:</strong> Factory Method is about
       <em>deferring</em> one instantiation to a subclass; Abstract Factory is about
       <em>guaranteeing</em> that several instantiations come from the same family.</p>` +
      ul([
        'Factory Method varies by <strong>inheritance</strong> — a new product means a new subclass.',
        'Abstract Factory varies by <strong>composition</strong> — you pass a different factory object in.',
        'A "simple factory" (a static method with a switch) is neither, and is not a GoF pattern — but it is the right answer most of the time, and saying so is a point in your favour.',
      ]) +
      bonus(
        `Where they already are: <code>Calendar.getInstance()</code> and
         <code>NumberFormat.getInstance(locale)</code> are simple factories.
         <code>Collection.iterator()</code> is a genuine factory method — the collection subclass
         decides which iterator you get. <code>DocumentBuilderFactory</code> is the JDK's clearest
         abstract factory. In Spring, <code>FactoryBean&lt;T&gt;</code> is the extension point for
         beans whose construction is too complicated for a constructor.`,
      ),
    followUps: [
      {
        q: 'When is a plain constructor the right answer?',
        a: `Almost always. A factory earns its keep when construction needs to <em>choose</em> a type,
            <em>cache</em> or pool instances, return a subtype the caller should not name, or hide a
            genuinely messy build. If it just calls <code>new</code>, it is a layer of indirection with
            no payoff.`,
      },
      {
        q: 'How do static factory methods differ from the pattern?',
        a: `<code>List.of()</code>, <code>Optional.of()</code>, <code>Integer.valueOf()</code> are
            static factory <em>methods</em> — an Effective Java idiom, not the GoF pattern. Their value
            is different: they have names, they need not create a new object (<code>valueOf</code>
            caches −128..127), and they can return a private subtype. No polymorphism is involved, which
            is exactly what makes them not the pattern.`,
      },
    ],
  },

  {
    id: 'pat-builder',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Implement Builder. What problem does it solve that constructors do not?',
    difficulty: 'easy',
    tags: ['patterns', 'creational'],
    answerHtml:
      tldr(
        'it replaces telescoping constructors and unreadable argument lists, and it lets an immutable object be assembled in steps and validated once.',
      ) +
      block(
        '❌ The problem',
        java(`
// Which is the port, which the timeout? What is the third boolean?
new HttpClient("api.corp.local", 443, 5000, 3, true, false, null);

// ...and the telescoping alternative, which grows as 2^optional-args
HttpClient(String host)
HttpClient(String host, int port)
HttpClient(String host, int port, int timeoutMs)`),
      ) +
      block(
        '✅ Builder',
        java(`
public final class HttpClient {
    private final String host;
    private final int port;
    private final Duration timeout;

    private HttpClient(Builder b) {     // only the builder constructs
        this.host = b.host;
        this.port = b.port;
        this.timeout = b.timeout;
    }

    public static Builder builder(String h) { return new Builder(h); }

    public static final class Builder {
        private final String host;           // required -> constructor
        private int port = 443;          // optional -> default
        private Duration timeout = Duration.ofSeconds(10);

        private Builder(String h) { this.host = requireNonNull(h); }

        public Builder port(int p) { port = p; return this; }
        public Builder timeout(Duration d) { timeout = d; return this; }

        public HttpClient build() {
            if (port < 1 || port > 65535) throw new BadPort(port);
            return new HttpClient(this);      // validate once, here
        }
    }
}

HttpClient c = HttpClient.builder("api.corp.local")
                         .timeout(Duration.ofSeconds(5))
                         .build();`),
      ) +
      `<p>Three things that buys you: the call site names every argument, the object is
       <strong>immutable</strong> once built, and there is exactly one place —
       <code>build()</code> — where cross-field validation can live.</p>` +
      ul([
        'Required arguments go in the <strong>builder\'s constructor</strong>, not as setters. That way the compiler enforces them rather than <code>build()</code> throwing at runtime.',
        'Validate in <code>build()</code>, not in each setter, so rules spanning two fields have somewhere to live.',
        'Copy mutable fields in the private constructor, or the builder can still mutate a "finished" object.',
      ]) +
      bonus(
        `In Java 16+, a <code>record</code> with a compact constructor covers many of the cases people
         reach for Builder for — immutability, validation in one place, and generated accessors. Builder
         still wins when there are many optional fields, when you want a fluent DSL, or when the object
         is assembled across several methods. Lombok's <code>@Builder</code> generates all of the above,
         at the cost of the reader not seeing it.`,
      ),
    followUps: [
      {
        q: 'Is a builder thread-safe?',
        a: `The built object is (if it is immutable). The builder itself is not, and must not be shared —
            it is mutable by design. One builder per construction, and never a static one.`,
      },
      {
        q: 'Where is this in the JDK and Spring?',
        a: `<code>StringBuilder</code> (loosely — it is mutable and has no <code>build()</code>),
            <code>Stream.Builder</code>, <code>Calendar.Builder</code>,
            <code>HttpRequest.newBuilder()</code> in the Java 11 HTTP client — that last one is a
            textbook implementation. In Spring: <code>UriComponentsBuilder</code>,
            <code>MockMvcRequestBuilders</code>, and the whole of the security DSL.`,
      },
    ],
  },
]
