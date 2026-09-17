import type { Question } from '../../types'
import { block, bonus, java, tldr, ul } from './highlight'

/**
 * Structural patterns — how objects are composed so the shape the caller sees
 * differs from the shape underneath.
 */

const TOPIC = 'design--structural'

export const structuralQuestions: Question[] = [
  {
    id: 'pat-adapter',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Adapter — implement it, and say how it differs from Facade and Decorator.',
    difficulty: 'easy',
    tags: ['patterns', 'structural'],
    answerHtml:
      tldr(
        'it converts one interface into another a client already expects — it changes the shape, never the behaviour.',
      ) +
      java(`
// What we have: a third-party library we cannot change.
class StripeGateway {
    StripeCharge charge(long cents, String ccy, String token);
}

// What our domain wants to talk to.
public interface PaymentProcessor {
    Receipt pay(Money amount, Card card);
}

// Implements ours, delegates to theirs, translates both ways.
public class StripeAdapter implements PaymentProcessor {
    private final StripeGateway stripe;

    public StripeAdapter(StripeGateway s) { this.stripe = s; }

    public Receipt pay(Money amount, Card card) {
        StripeCharge c = stripe.charge(
            amount.toCents(), amount.currency().code(), card.token());
        // translate their model into ours
        return new Receipt(c.id(), c.status() == SUCCEEDED);
    }
}`) +
      `<p><strong>The three get confused constantly, so separate them by intent:</strong></p>` +
      ul([
        '<strong>Adapter</strong> — the interface is <em>wrong</em>. Different interface, same behaviour.',
        '<strong>Decorator</strong> — the interface is <em>right</em>, the behaviour is missing something. Same interface, more behaviour.',
        '<strong>Facade</strong> — the interface is <em>too much</em>. A new, simpler interface over many objects.',
        '<strong>Proxy</strong> — the interface is right and the behaviour is right, but access needs controlling. Same interface, same behaviour, different <em>when</em> or <em>whether</em>.',
      ]) +
      bonus(
        `This is also the pattern that makes DIP practical against third-party code. The domain declares
         <code>PaymentProcessor</code> in its own language; the adapter lives in the infrastructure
         layer and absorbs the vendor's model. Swapping Stripe for Adyen then touches one file, and the
         domain does not recompile.`,
      ),
    followUps: [
      {
        q: 'Object adapter vs class adapter?',
        a: `Class adapter extends the adaptee (needs multiple inheritance, so in Java it only works when
            the adaptee is an interface); object adapter <em>holds</em> it. Prefer the object form —
            it composes, it can adapt subclasses, and it does not inherit the adaptee's whole surface.`,
      },
      {
        q: 'Where is it in the JDK?',
        a: `<code>Arrays.asList()</code> adapts an array to <code>List</code>.
            <code>InputStreamReader</code> adapts a byte stream to a character stream — the canonical
            example, because the conversion (bytes → chars via a charset) is exactly the translation
            work an adapter does.`,
      },
    ],
  },

  {
    id: 'pat-decorator',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Decorator — implement it, and explain why the JDK I/O streams are built this way.',
    difficulty: 'medium',
    tags: ['patterns', 'structural'],
    answerHtml:
      tldr(
        'it adds behaviour to one object at runtime by wrapping it in something of the same type — composition instead of a subclass per combination.',
      ) +
      java(`
public interface DataSource { void write(String data); String read(); }

class FileDataSource implements DataSource { /* the real one */ }

// The base decorator: same interface, holds one of the same interface.
abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrapped;
    protected DataSourceDecorator(DataSource w) { this.wrapped = w; }
}

class EncryptionDecorator extends DataSourceDecorator {
    EncryptionDecorator(DataSource w) { super(w); }
    public void write(String data) { wrapped.write(encrypt(data)); }
    public String read()           { return decrypt(wrapped.read()); }
}

class CompressionDecorator extends DataSourceDecorator { /* ditto */ }

// Stack in any order, at runtime, with no class per combination:
DataSource source = new EncryptionDecorator(
                        new CompressionDecorator(
                            new FileDataSource("x.dat")));`) +
      `<p><strong>Why not inheritance.</strong> Two optional behaviours need
       <code>EncryptedFile</code>, <code>CompressedFile</code>, <code>EncryptedCompressedFile</code> —
       and the count is 2ⁿ. Decorators are <em>n</em> classes for the same 2ⁿ combinations, chosen at
       runtime rather than compile time.</p>` +
      block(
        'The JDK example to name',
        java(`
new BufferedReader(
    new InputStreamReader(          // bytes→chars: an adapter
        new FileInputStream("f.txt")));

new DataOutputStream(
    new BufferedOutputStream(new FileOutputStream("f.bin")));`),
      ) +
      `<p>This is also the honest criticism of the pattern: <code>java.io</code> is the standard
       example of decorators <em>and</em> the standard complaint about them. The stack is verbose, the
       stack trace is deep, and you must know the right wrapping order. <code>Files.newBufferedReader()</code>
       exists because the assembly was too tedious to expose.</p>` +
      bonus(
        `<code>Collections.unmodifiableList()</code> and <code>synchronizedList()</code> are decorators
         too — and <code>unmodifiableList</code> is the one that breaks LSP, since it decorates by
         <em>removing</em> behaviour (<code>add()</code> throws). A decorator is supposed to add.
         Spotting that is a strong answer.`,
      ),
    followUps: [
      {
        q: 'Decorator vs Proxy — both wrap and both keep the interface.',
        a: `Intent, and who decides. A decorator <em>adds</em> behaviour and the client deliberately
            composes the stack. A proxy <em>controls access</em> to the subject — lazily creating it,
            checking rights, caching, going over the network — and the client usually does not know it
            is there. Same structure, opposite relationship with the caller.`,
      },
      {
        q: 'Does order matter?',
        a: `Yes, and it is a real source of bugs. Compress-then-encrypt is right; encrypt-then-compress
            barely compresses, because ciphertext is high-entropy. Decorators are not commutative, and
            nothing in the type system tells you that.`,
      },
    ],
  },

  {
    id: 'pat-proxy',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Proxy — implement it, and explain how Spring AOP uses it (and the trap that follows).',
    difficulty: 'hard',
    tags: ['patterns', 'structural', 'spring'],
    answerHtml:
      tldr(
        'a stand-in with the same interface that controls access to the real object — and it is the mechanism behind <code>@Transactional</code>, <code>@Cacheable</code> and <code>@Async</code>.',
      ) +
      java(`
public interface ReportService { Report generate(int id); }

class RealReportService implements ReportService {
    public Report generate(int id) { /* slow */ }
}

// Virtual + caching proxy: controls WHEN the real work happens.
class CachingReportProxy implements ReportService {
    private final ReportService real;
    private final Map<Integer, Report> cache =
        new ConcurrentHashMap<>();

    CachingReportProxy(ReportService real) { this.real = real; }

    public Report generate(int id) {
        return cache.computeIfAbsent(id, real::generate);
    }
}`) +
      `<p><strong>How Spring does it.</strong> When you annotate a bean with
       <code>@Transactional</code>, Spring does not inject your object. It injects a proxy — a JDK
       dynamic proxy if the class implements an interface, a CGLIB subclass if not. The proxy opens the
       transaction, calls your method, then commits or rolls back.</p>` +
      block(
        '⚠ The trap every interviewer asks about — self-invocation',
        java(`
@Service
class OrderService {
    public void processAll(List<Order> orders) {
        for (Order o : orders) {
            save(o);      // ← plain 'this': the proxy is NOT involved
        }                       //   @Transactional here does NOTHING
    }

    @Transactional
    public void save(Order o) { repo.save(o); }
}`),
      ) +
      `<p>The proxy wraps the <em>bean</em>, so only calls that arrive from outside go through
       it. <code>this.save(o)</code> is a direct invocation on the target, and the annotation is
       silently ignored — no error, no warning, no transaction.</p>` +
      ul([
        '<strong>Fix</strong> — move <code>save</code> to a separate bean and inject it, so the call crosses the proxy boundary.',
        'Or self-inject the proxy (<code>@Lazy ApplicationContext</code>/self reference) — it works, and it reads like an apology.',
        'Or switch to AspectJ load-time weaving, which modifies the bytecode and so has no proxy boundary at all.',
        'Same trap applies to <code>@Cacheable</code>, <code>@Async</code>, <code>@PreAuthorize</code> — anything proxy-based.',
      ]) +
      bonus(
        `Two more consequences worth volunteering: with CGLIB the method cannot be <code>final</code> or
         <code>private</code> (the proxy subclasses and overrides it — a <code>final</code> method
         cannot be overridden, so the annotation silently does nothing again), and a proxied bean's
         constructor runs on the target, not the proxy, so <code>@Transactional</code> in
         <code>@PostConstruct</code> does not apply either.`,
      ),
    followUps: [
      {
        q: 'JDK dynamic proxy vs CGLIB — when does Spring pick which?',
        a: `JDK proxies require an interface and implement it via <code>InvocationHandler</code>; CGLIB
            generates a subclass at runtime and needs a non-final class with a usable constructor.
            Spring Boot defaults to CGLIB (<code>proxyTargetClass=true</code>) so behaviour does not
            change the day someone adds an interface.`,
      },
      {
        q: 'Name the kinds of proxy.',
        a: `<strong>Virtual</strong> — defer creating something expensive (Hibernate lazy loading is
            exactly this, and is why touching a lazy collection outside the session throws
            <code>LazyInitializationException</code>). <strong>Protection</strong> — access control.
            <strong>Remote</strong> — the object is on another machine. <strong>Caching</strong> — as above.`,
      },
      {
        q: 'How does this relate to the Decorator you just described?',
        a: `Structurally identical — both implement the interface and hold an instance of it. The
            difference is intent and ownership: the client builds a decorator stack deliberately, while
            a proxy is usually installed by the framework and the client never knows. That is why the
            self-invocation trap is surprising: you cannot see the wrapper in the code.`,
      },
    ],
  },

  {
    id: 'pat-facade-composite-flyweight',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Facade, Composite and Flyweight — one example each, and when they earn their keep.',
    difficulty: 'medium',
    tags: ['patterns', 'structural'],
    answerHtml:
      tldr(
        'Facade simplifies a subsystem; Composite lets a tree and a leaf share one interface; Flyweight shares immutable state across many objects.',
      ) +
      block(
        'Facade — one door into a subsystem',
        java(`
public class VideoConverter {                       // the facade
    public File convert(String filename, String format) {
        // five collaborators the caller should not know about
        VideoFile file = new VideoFile(filename);
        Codec source = CodecFactory.extract(file);
        Codec target = format.equals("mp4")
            ? new Mp4Codec() : new OggCodec();
        Buffer buffer = BitrateReader.read(file, source);
        return AudioMixer.fix(BitrateReader.convert(buffer, target));
    }
}`),
      ) +
      `<p>It adds no behaviour and blocks nothing — the subsystem stays reachable for callers
       who need it. That is the difference from an adapter, which exists because the old interface is
       unusable.</p>` +
      block(
        'Composite — a leaf and a branch answer the same question',
        java(`
interface FileSystemNode { long size(); }

record FileNode(String name, long bytes) implements FileSystemNode {
    public long size() { return bytes; }
}

record Directory(String name, List<FileSystemNode> children)
        implements FileSystemNode {
    public long size() {          // recursion the caller never sees
        return children.stream().mapToLong(FileSystemNode::size).sum();
    }
}`),
      ) +
      `<p>The win is that the client never writes <code>if (node instanceof Directory)</code>.
       Any tree where "one" and "many" should be treated alike is a candidate — UI component trees,
       menus, org charts, a rendered DOM.</p>` +
      block(
        'Flyweight — share what is the same, pass in what differs',
        java(`
// Intrinsic state (shared, immutable) lives in the flyweight:
record TreeType(String name, Color colour, Texture texture) {
    void draw(Canvas c, int x, int y) { /* x,y are extrinsic */ }
}

class TreeTypeRegistry {
    private static final Map<String, TreeType> CACHE =
        new ConcurrentHashMap<>();
    static TreeType of(String name, Color c, Texture t) {
        return CACHE.computeIfAbsent(
            name + c + t, k -> new TreeType(name, c, t));
    }
}

// A million trees, a handful of TreeType objects.
record Tree(int x, int y, TreeType type) {}`),
      ) +
      bonus(
        `Flyweight is already in your JVM and it has a visible side effect. <code>Integer.valueOf()</code>
         caches −128..127, which is why <code>Integer a = 127, b = 127; a == b</code> is <code>true</code>
         but the same with <code>128</code> is <code>false</code>. String interning is the same idea.
         That cache is the reason <code>==</code> on boxed types is a bug that passes its unit test.`,
      ),
    followUps: [
      {
        q: 'When is a Facade a bad idea?',
        a: `When it becomes the only way in and keeps growing — a "god facade" that every feature adds a
            method to has just moved the mess behind a door. A facade should serve one use case; several
            small ones beat one large one.`,
      },
      {
        q: 'What does Composite cost?',
        a: `Type safety. If <code>Directory</code> and <code>FileNode</code> share an interface, methods
            meaningful for only one of them (<code>add()</code>) either live on the interface and throw
            for leaves — an LSP violation — or live only on the branch, and the client is back to
            checking types. GoF acknowledged this trade-off and did not resolve it; neither can you.`,
      },
    ],
  },
]
