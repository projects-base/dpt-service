import type { Question } from '../../types'
import { block, bonus, java, tldr, ul } from './highlight'

/**
 * Behavioural patterns — how responsibility is assigned and how objects talk.
 *
 * This is the family LLD rounds actually reach for: nearly every "design a
 * parking lot / vending machine / elevator" question resolves to Strategy,
 * State, Observer or Chain of Responsibility.
 */

const TOPIC = 'design--behavioural'

export const behaviouralQuestions: Question[] = [
  {
    id: 'pat-strategy-vs-state',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Strategy and State look identical in UML. What actually separates them?',
    difficulty: 'hard',
    tags: ['patterns', 'behavioural'],
    answerHtml:
      tldr(
        'Strategy swaps an algorithm the <em>caller</em> chose and the strategies do not know each other; State swaps behaviour the <em>object</em> chose, and the states know the transitions.',
      ) +
      block(
        'Strategy — the client picks, the strategies are peers',
        java(`
public interface SortStrategy { void sort(int[] data); }

class QuickSort implements SortStrategy {
    public void sort(int[] d) { /* ... */ }
}
class MergeSort implements SortStrategy {
    public void sort(int[] d) { /* ... */ }
}

class Sorter {
    private SortStrategy strategy;
    // the CALLER decides
    void setStrategy(SortStrategy s) { this.strategy = s; }
    void sort(int[] data) { strategy.sort(data); }
}`),
      ) +
      block(
        'State — the object transitions itself',
        java(`
interface OrderState {
    void next(OrderContext ctx);
    default void cancel(OrderContext ctx) {
        throw new IllegalStateException("cannot cancel");
    }
}

class Placed implements OrderState {
    // ← a state knows what follows it
    public void next(OrderContext c)   { c.setState(new Paid()); }
    public void cancel(OrderContext c) { c.setState(new Cancelled()); }
}

class Shipped implements OrderState {
    public void next(OrderContext c) { c.setState(new Delivered()); }
    // cancel() deliberately not overridden — a shipped order cannot
    // be cancelled, so the illegal transition is now enforced, not
    // merely discouraged
}

class OrderContext {
    private OrderState state = new Placed();
    void setState(OrderState s) { this.state = s; }
    void next()   { state.next(this); }
    void cancel() { state.cancel(this); }
}`),
      ) +
      `<p><strong>The three real differences:</strong></p>` +
      ul([
        '<strong>Who chooses</strong> — the client injects a Strategy; the object moves itself between States.',
        '<strong>Awareness</strong> — strategies are mutually ignorant; states reference the states they lead to.',
        '<strong>Lifetime</strong> — a Strategy is usually set once; State changes many times during one object\'s life.',
      ]) +
      bonus(
        `The payoff of State is that it deletes the nested <code>if (status == PLACED && ...)</code>
         ladder that these objects otherwise grow, and it makes illegal transitions <em>impossible
         to express</em> rather than merely unlikely. Say that, then say the cost honestly: one class
         per state, and the transition graph is now spread across all of them instead of visible in one
         table — which is why a small state machine is often better as an enum with a transition map.`,
      ),
    followUps: [
      {
        q: 'Can a Java enum implement State?',
        a: `Yes, and for a fixed, small machine it is the nicest form — constant-specific method bodies
            give you one class, an exhaustive switch, and free serialisation. It stops working when a
            state needs its own fields, or when states are added by configuration.`,
      },
      {
        q: 'How does Strategy relate to Open/Closed?',
        a: `It is the usual mechanism for it. The fee-calculator fix for OCP <em>is</em> Strategy: a new
            payment type adds a class instead of editing a conditional. In Java, a strategy with one
            method is just a lambda — <code>Comparator</code> is the pattern with the ceremony removed.`,
      },
    ],
  },

  {
    id: 'pat-observer',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Observer — implement it, and say when you would reach for an event bus instead.',
    difficulty: 'medium',
    tags: ['patterns', 'behavioural'],
    answerHtml:
      tldr(
        'one-to-many notification where the subject knows only that listeners exist, not who they are.',
      ) +
      java(`
public interface OrderListener { void onOrderPlaced(Order order); }

public class OrderService {
    // safe iteration under concurrent add
    private final List<OrderListener> listeners =
        new CopyOnWriteArrayList<>();
    public void add(OrderListener l)    { listeners.add(l); }
    public void remove(OrderListener l) { listeners.remove(l); }

    public void place(Order order) {
        repository.save(order);
        for (OrderListener l : listeners) {
            try {
                // one bad listener must not fail the order
                l.onOrderPlaced(order);
            } catch (RuntimeException e) {
                log.error("listener {} failed", l, e);
            }
        }
    }
}`) +
      `<p>Three details that separate a real implementation from a whiteboard one:</p>` +
      ul([
        '<code>CopyOnWriteArrayList</code>, or a listener that unsubscribes during notification gives you <code>ConcurrentModificationException</code>.',
        'Catch per listener. Otherwise the fifth observer\'s bug rolls back the order.',
        '<strong>The lapsed listener leak</strong> — a subject holds strong references forever, so a listener that forgets to unregister is never collected, and neither is anything it points at. This is one of the most common real memory leaks in long-lived Java apps. Return an unsubscribe handle, or hold weak references.',
      ]) +
      block(
        'When to use a bus instead',
        `<p>When the subject should not hold the listener list at all. The dashboard in this
         very repository does exactly that: three pairs of modules had a genuine downward
         dependency plus one call back upwards, and that upward call became an announcement
         (<code>TAB_CHANGED</code>, <code>CATEGORIES_CHANGED</code>). The publisher says what
         happened and does not know who listens — which is what broke the import cycles.</p>`,
      ) +
      bonus(
        `Do not reach for a bus by default. An event bus used for everything is a global with extra
         steps: you lose "find all callers", the ordering becomes implicit, and a typo in an event name
         fails silently instead of at compile time. Use it where a direct import would create a cycle —
         and where it would not, keep the plain import.`,
      ),
    followUps: [
      {
        q: 'Why was java.util.Observable deprecated in Java 9?',
        a: `It is a class, not an interface, so it burns your one inheritance slot; it is not
            serialisable; its notification order is unspecified; and it is not thread-safe in any useful
            way. The replacements are <code>PropertyChangeListener</code>, a plain listener interface
            like the one above, or <code>Flow</code>/reactive streams when you need back-pressure.`,
      },
      {
        q: 'Synchronous or asynchronous notification?',
        a: `Synchronous is simpler and keeps the listener inside the caller's transaction — which is
            sometimes exactly what you want and sometimes a disaster, because a slow listener now slows
            the order. Spring lets you choose: <code>@EventListener</code> is synchronous,
            <code>@TransactionalEventListener(phase = AFTER_COMMIT)</code> fires only once the data is
            actually durable, which is usually the correct choice for "send the confirmation email".`,
      },
    ],
  },

  {
    id: 'pat-template-command-chain',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Template Method, Command and Chain of Responsibility — one example each.',
    difficulty: 'medium',
    tags: ['patterns', 'behavioural'],
    answerHtml:
      tldr(
        'Template Method fixes the steps and varies one; Command turns a request into an object; Chain passes a request along handlers until one takes it.',
      ) +
      block(
        'Template Method — the skeleton is final, the holes are abstract',
        java(`
abstract class DataImporter {
    // final: subclasses change steps, never the order
    public final void run(Path file) {
        var raw = read(file);
        var records = parse(raw);               // ← the hole
        validate(records);
        persist(records);
        afterImport(records);        // ← optional hook, no-op default
    }

    protected abstract List<Record> parse(String raw);
    protected void afterImport(List<Record> records) {}
}

class CsvImporter extends DataImporter {
    protected List<Record> parse(String raw) { /* ... */ }
}
class JsonImporter extends DataImporter {
    protected List<Record> parse(String raw) { /* ... */ }
}`),
      ) +
      `<p>Note <code>final</code> on <code>run</code> — without it a subclass can override the
       algorithm and the pattern's one guarantee is gone. It is the "Hollywood principle": the base
       class calls you.</p>` +
      block(
        'Command — a request with an identity, so it can be queued, logged and undone',
        java(`
public interface Command {
    void execute();
    void undo();
}

class AddTextCommand implements Command {
    private final Document doc; private final String text;
    AddTextCommand(Document d, String t) { doc = d; text = t; }

    public void execute() { doc.append(text); }
    public void undo()    { doc.removeLast(text.length()); }
}

class CommandHistory {                       // undo falls out for free
    private final Deque<Command> done = new ArrayDeque<>();
    void run(Command c)  { c.execute(); done.push(c); }
    void undo()          { if (!done.isEmpty()) done.pop().undo(); }
}`),
      ) +
      `<p>Once a request is an object it can be put on a queue, retried, serialised to a log and
       replayed, or scheduled — which is why <code>Runnable</code> is a Command, and why every task
       executor takes one.</p>` +
      block(
        'Chain of Responsibility — each link handles it or passes it on',
        java(`
public abstract class Handler {
    private Handler next;

    public Handler linkTo(Handler n) { this.next = n; return n; }

    public final void handle(Request r) {
        if (canHandle(r)) { process(r); return; }
        if (next != null) next.handle(r);
        else throw new IllegalStateException("nobody handled " + r);
    }

    protected abstract boolean canHandle(Request r);
    protected abstract void process(Request r);
}`),
      ) +
      bonus(
        `Point at where these already are, because it proves you have read code and not only a book.
         <strong>Template Method</strong>: <code>AbstractList</code>, <code>InputStream.read()</code>,
         Spring's <code>JdbcTemplate</code> and <code>RestTemplate</code> — the name is the pattern.
         <strong>Command</strong>: <code>Runnable</code>, <code>Callable</code>, every
         <code>ExecutorService.submit()</code>.
         <strong>Chain</strong>: <code>javax.servlet.Filter</code> and Spring Security's filter chain,
         which is the clearest production example most Java developers touch weekly.`,
      ),
    followUps: [
      {
        q: 'Template Method vs Strategy — both vary one step.',
        a: `Template Method varies it by <strong>inheritance</strong>, at compile time, and the subclass
            can only fill the holes the base class left. Strategy varies it by <strong>composition</strong>,
            at runtime, and the strategy is swappable per call. Prefer Strategy when you can — inheritance
            binds the variation to the type, and you get one subclass per combination again.`,
      },
      {
        q: 'What is the risk with Chain of Responsibility?',
        a: `That nothing handles the request and it vanishes silently. Always define the terminal
            behaviour explicitly — the <code>throw</code> above — rather than letting the chain fall off
            the end. Debugging is the other cost: the stack is deep and the routing is implicit.`,
      },
    ],
  },
]
