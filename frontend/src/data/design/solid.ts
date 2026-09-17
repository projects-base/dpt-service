import type { Question } from '../../types'
import { block, bonus, java, tldr, ul } from './highlight'

/**
 * SOLID, as five drillable questions.
 *
 * The legacy kit already carries a paragraph on each principle as reference
 * prose. Prose is not drillable — it never enters the review ladder, and you
 * cannot rehearse a definition you only ever read. These are the same five
 * principles written the way the interview actually runs: name it, show a
 * violation you have genuinely seen, fix it in code, then survive the
 * follow-up.
 *
 * Every answer follows the topic's own promise — "know the definition, a
 * violation, and the fix for each" — because that is the order an interviewer
 * asks for them in.
 */

const T = {
  srp: 'design--s-single-responsibility-principle',
  ocp: 'design--o-open-closed-principle',
  lsp: 'design--l-liskov-substitution-principle',
  isp: 'design--i-interface-segregation-principle',
  dip: 'design--d-dependency-inversion-principle',
} as const

export const solidQuestions: Question[] = [
  {
    id: 'solid-srp',
    topicId: T.srp,
    categoryId: 'design',
    prompt: 'Single Responsibility — define it, show a violation, and fix it.',
    difficulty: 'easy',
    tags: ['solid', 'lld'],
    answerHtml:
      tldr(
        'a class should have one reason to change — one <em>actor</em> who can ask for it to change.',
      ) +
      `<p>The common misreading is "a class should do one thing", which is too vague to act
       on: every class does one thing at some level of zoom. Uncle Bob's own phrasing is
       sharper — group the things that change <strong>for the same person</strong>.</p>` +
      block(
        '❌ Violation',
        java(`
class OrderService {
    void place(Order o) {
        if (o.items().isEmpty()) throw new Invalid();  // rules
        jdbc.update("insert into orders ...", o.id()); // persistence
        mail.send(o.email(), "Thanks!", render(o));   // messaging
        pdf.write(invoiceFor(o));                     // reporting
    }
}`),
      ) +
      `<p>Four actors can force a change here: the business (rules), the DBA (schema),
       marketing (the email), finance (the invoice layout). A new email provider makes
       you edit — and retest — order logic.</p>` +
      block(
        '✅ Fix',
        java(`
class OrderService {              // orchestrates; decides nothing
    private final OrderValidator validator;
    private final OrderRepository repository;
    private final NotificationService notifications;
    private final InvoiceGenerator invoices;

    void place(Order o) {
        validator.validate(o);
        repository.save(o);
        notifications.orderPlaced(o);
        invoices.generate(o);
    }
}`),
      ) +
      `<p><strong>Signals you are violating it</strong></p>` +
      ul([
        'The name contains "And", or is <code>Manager</code>/<code>Util</code>/<code>Helper</code> — names that mean "miscellaneous".',
        'The unit test needs six mocks to reach one branch.',
        'Two teams keep touching the same file for unrelated reasons, and keep hitting merge conflicts.',
        'A change to a private method forces a change to an unrelated public one.',
      ]) +
      bonus(
        `SRP is the principle most often taken too far. Split until the reasons to change are separate,
         then stop — a codebase of 200 one-method classes has simply moved the complexity into the wiring.
         The honest version of this answer names that trade-off.`,
      ),
    followUps: [
      {
        q: 'Is a class with one public method automatically SRP-compliant?',
        a: `No. <code>process()</code> that validates, saves and notifies has one method and four reasons
            to change. The count that matters is reasons, not methods.`,
      },
      {
        q: 'How does SRP relate to cohesion and coupling?',
        a: `It is high cohesion stated as a rule. Members of a class should be used together by the same
            caller; when one group of fields is only touched by one group of methods, that is the seam
            to split on. Splitting well usually lowers coupling too, because each piece now depends on less.`,
      },
      {
        q: 'Does SRP apply above the class level?',
        a: `Yes, and it bites hardest there. A microservice owned by two teams for two different reasons
            has the same problem, with a network in the middle — every release needs both teams to agree.
            Service boundaries drawn along actors survive; boundaries drawn along nouns do not.`,
      },
    ],
  },

  {
    id: 'solid-ocp',
    topicId: T.ocp,
    categoryId: 'design',
    prompt: 'Open/Closed — define it, show a violation, and fix it.',
    difficulty: 'medium',
    tags: ['solid', 'lld', 'strategy'],
    answerHtml:
      tldr('open for extension, closed for modification — add behaviour by adding code, not editing it.') +
      block(
        '❌ Violation',
        java(`
BigDecimal fee(Payment p) {
    if (p.type() == CARD)   return pct(p, "0.029");
    if (p.type() == PAYPAL) return pct(p, "0.034");
    // every new type edits this method, risking the existing ones
    throw new IllegalArgumentException("unknown type");
}`),
      ) +
      `<p>The cost is not the edit, it is the retest. Touching this method puts CARD and PAYPAL
       back in scope for regression every time someone adds a type.</p>` +
      block(
        '✅ Fix — polymorphism, with the dispatch done once',
        java(`
public interface FeeCalculator {
    boolean supports(PaymentType type);
    BigDecimal fee(Payment p);
}

@Service
class CardFee implements FeeCalculator {
    public boolean supports(PaymentType t) { return t == CARD; }
    public BigDecimal fee(Payment p) { return pct(p, "0.029"); }
}

@Service
class FeeService {
    // Spring injects every implementation it can find
    private final List<FeeCalculator> calculators;

    BigDecimal fee(Payment p) {
        return calculators.stream()
            .filter(c -> c.supports(p.type()))
            .findFirst()
            .orElseThrow(() -> new NoCalculator(p.type()))
            .fee(p);
    }
}`),
      ) +
      `<p>A new payment type is now a new file. <code>FeeService</code> is never reopened,
       so the existing calculators are never put at risk.</p>` +
      bonus(
        `The honest caveat: OCP is only free if you guessed the axis of change correctly. Abstracting
         the wrong axis costs you an interface and buys nothing. The professional move is to write the
         <code>if</code> the first time, and refactor to this the <em>second</em> time a type appears —
         at which point the axis is evidence rather than a guess.`,
      ),
    followUps: [
      {
        q: 'Is a switch statement always an OCP violation?',
        a: `No. Over a genuinely closed set — days of the week, the four suits, an enum you own and that
            will not grow — a switch is clearer than polymorphism, and Java's exhaustive switch over a
            sealed type makes the compiler tell you when the set does grow. The violation is a switch
            over an <em>open</em> set.`,
      },
      {
        q: 'How does Spring itself use this?',
        a: `<code>List&lt;T&gt;</code> injection of every implementation is the mechanism above.
            <code>HandlerMethodArgumentResolver</code> is the same shape — Spring MVC never edits its
            dispatch to support a new parameter type, you register a resolver. So is
            <code>@ConditionalOnMissingBean</code>: Boot's auto-configuration extends by addition.`,
      },
      {
        q: 'What breaks if two calculators both claim to support a type?',
        a: `<code>findFirst()</code> silently picks whichever Spring ordered first — a genuinely nasty
            bug. Either make it explicit with <code>@Order</code>, or fail loudly: collect the matches
            and throw when there is more than one. I prefer failing loudly, because the alternative is
            a fee that is correct in test and wrong in production.`,
      },
    ],
  },

  {
    id: 'solid-lsp',
    topicId: T.lsp,
    categoryId: 'design',
    prompt: 'Liskov Substitution — define it, show a violation, and fix it.',
    difficulty: 'medium',
    tags: ['solid', 'lld', 'inheritance'],
    answerHtml:
      tldr(
        'a subtype must be usable anywhere its supertype is, without the caller knowing or changing.',
      ) +
      `<p>It is a rule about <em>behaviour</em>, not shape. The compiler checks the shape;
       LSP is the part the compiler cannot check.</p>` +
      block(
        '❌ Violation — the textbook one, which is textbook because it is real',
        java(`
class Rectangle {
    protected int w, h;
    void setWidth(int w)  { this.w = w; }
    void setHeight(int h) { this.h = h; }
    int area() { return w * h; }
}

class Square extends Rectangle {
    // keeps its own invariant by breaking the caller's
    void setWidth(int w)  { this.w = w; this.h = w; }
    void setHeight(int h) { this.w = h; this.h = h; }
}

// Correct for every Rectangle, wrong for Square:
r.setWidth(5); r.setHeight(4);
assert r.area() == 20;              // Square gives 16`),
      ) +
      block(
        '✅ Fix',
        java(`
// A square IS-A rectangle in geometry, but a mutable Square is
// not a behavioural subtype of a mutable Rectangle. Two ways out:

// 1. Immutable — with no setters the invariant cannot break.
record Rectangle(int w, int h) { int area() { return w * h; } }
record Square(int side)        { int area() { return side * side; } }

// 2. Or share an interface rather than an implementation.
interface Shape { int area(); }`),
      ) +
      `<p><strong>The rules a subtype must obey</strong></p>` +
      ul([
        '<strong>Preconditions may not be strengthened</strong> — the override cannot demand more than the parent (parent accepts any <code>int</code>, child rejects negatives).',
        '<strong>Postconditions may not be weakened</strong> — it must still deliver everything the parent promised.',
        '<strong>Invariants must be preserved</strong> — the <code>Square</code> failure above.',
        '<strong>No new exceptions</strong> the caller was not written to handle. <code>UnsupportedOperationException</code> in an override is the loudest possible LSP violation.',
      ]) +
      bonus(
        `The JDK violates it deliberately and documents the cost: <code>Arrays.asList()</code> and
         <code>List.of()</code> return lists whose <code>add()</code> throws
         <code>UnsupportedOperationException</code>. That is why <code>Collection</code> has the
         "optional operations" wording — an admission that the hierarchy is not substitutable, and
         the reason unmodifiable collections are a runtime surprise rather than a compile error.`,
      ),
    followUps: [
      {
        q: 'How would you detect an LSP violation in a code review?',
        a: `Look for <code>instanceof</code> or a type check in the <em>caller</em> — it means the caller
            has learned the subtypes are not interchangeable. Also: an override that throws where the
            parent does not, an override that is empty, and any comment of the form "don't pass a X here".`,
      },
      {
        q: 'Does LSP mean I should never use inheritance?',
        a: `It means inheritance is for substitutability, not for code reuse. If all you want is to reuse
            a method, compose. "Prefer composition over inheritance" is the practical form of LSP —
            composition has no substitutability obligation to break.`,
      },
      {
        q: 'Give a non-textbook example.',
        a: `A <code>ReadOnlyRepository</code> extending <code>Repository</code> and throwing on
            <code>save()</code>. Every caller written against <code>Repository</code> is now a
            landmine. The fix is the ISP one: <code>ReadRepository</code> and
            <code>WriteRepository</code> as separate interfaces, with the read-only type implementing
            only the first.`,
      },
    ],
  },

  {
    id: 'solid-isp',
    topicId: T.isp,
    categoryId: 'design',
    prompt: 'Interface Segregation — define it, show a violation, and fix it.',
    difficulty: 'easy',
    tags: ['solid', 'lld'],
    answerHtml:
      tldr('no client should be forced to depend on methods it does not use.') +
      block(
        '❌ Violation',
        java(`
interface Worker {
    void work();
    void eat();       // a robot does not eat
    void sleep();     // nor sleep
}

class Robot implements Worker {
    public void work()  { /* ... */ }
    // and now LSP is broken too
    public void eat()   { throw new UnsupportedOperationException(); }
    public void sleep() { throw new UnsupportedOperationException(); }
}`),
      ) +
      `<p>Note what just happened: a fat interface forced an LSP violation. The two
       principles fail together, which is why interviewers like this pair.</p>` +
      block(
        '✅ Fix — split along the clients, not along the nouns',
        java(`
interface Workable  { void work(); }
interface Feedable  { void eat(); }
interface Restable  { void sleep(); }

class Robot  implements Workable {}
class Human  implements Workable, Feedable, Restable {}`),
      ) +
      `<p>The test is not "is this interface small?" but "does every implementor
       have a meaningful body for every method?" If the answer is no, the interface is
       serving two different clients and wants splitting.</p>` +
      bonus(
        `This is the one principle I can point at in this very codebase. The dashboard's
         portals feature needed to add a single node to the knowledge graph, and was importing the
         vis-network <code>nodes</code> and <code>edges</code> DataSets to do it — which meant knowing
         the node shape and remembering the pillar edge. It now calls
         <code>addNodeToRenderedGraph(node)</code>: the narrow thing it needed instead of the wide
         thing it had.`,
      ),
    followUps: [
      {
        q: 'Is ISP just "keep interfaces small"?',
        a: `No — it is "keep interfaces focused on one client". A six-method interface where every
            implementor implements all six meaningfully is fine. A two-method interface where half the
            implementors throw on one of them is not.`,
      },
      {
        q: 'How do Java 8 default methods change this?',
        a: `They relieve the symptom and can hide the disease. A <code>default</code> lets you add to an
            interface without breaking implementors — genuinely useful, and how <code>stream()</code>
            reached <code>Collection</code>. But a default that throws, or that no-ops, is still forcing
            a client to carry a method it does not want. The smell moved, it did not leave.`,
      },
      {
        q: 'Where does the JDK get this right?',
        a: `<code>Runnable</code>, <code>Callable</code>, <code>Comparable</code>,
            <code>AutoCloseable</code> — one method, one reason for a client to care, which is exactly
            why they compose so freely and why they became the functional interfaces.`,
      },
    ],
  },

  {
    id: 'solid-dip',
    topicId: T.dip,
    categoryId: 'design',
    prompt: 'Dependency Inversion — define it, show a violation, and fix it.',
    difficulty: 'medium',
    tags: ['solid', 'lld', 'spring'],
    answerHtml:
      tldr(
        'high-level policy should not depend on low-level detail — both should depend on an abstraction owned by the policy.',
      ) +
      block(
        '❌ Violation',
        java(`
class OrderService {
    // concrete, and self-constructed: no seam to substitute at
    private final MySqlOrderRepo repo = new MySqlOrderRepo();
    private final SmtpMailer mailer = new SmtpMailer("smtp.corp");
}`),
      ) +
      `<p>Two separate problems. It depends on a <em>detail</em> (MySQL, SMTP), and it
       <em>constructs</em> that detail, so there is no seam to substitute at. You cannot unit test
       this without a database and a mail server.</p>` +
      block(
        '✅ Fix',
        java(`
// The abstraction is declared next to the POLICY, and phrased in
// the policy's language — not "MailSender" but what the domain wants.
public interface OrderNotifier { void orderPlaced(Order o); }
public interface OrderRepository { void save(Order o); }

class OrderService {
    private final OrderRepository repo;
    private final OrderNotifier notifier;

    // injected, not constructed
    OrderService(OrderRepository repo, OrderNotifier notifier) {
        this.repo = repo;
        this.notifier = notifier;
    }
}

// The detail depends on the abstraction, not the other way round.
// This lives in infrastructure and implements the domain's interface.
@Component
class SmtpOrderNotifier implements OrderNotifier { /* ... */ }`),
      ) +
      `<p><strong>Where the "inversion" actually is.</strong> Without it the arrow runs
       policy → detail. With it, both arrows point at the interface, and since the interface is owned
       by the policy, the detail's compile-time dependency now points <em>up</em>. That reversal is the
       whole principle; it is also exactly what lets the domain module compile with no knowledge that
       a database exists.</p>` +
      bonus(
        `Distinguish the three, because interviewers conflate them and are pleased when you do not.
         <strong>DIP</strong> is the principle — depend on abstractions.
         <strong>Dependency injection</strong> is a technique for supplying them.
         <strong>A DI container</strong> (Spring) is a tool that automates the technique.
         You can obey DIP with no framework at all — constructor parameters and a <code>main</code>
         that wires them is enough, and is exactly what the composition root in this dashboard does.`,
      ),
    followUps: [
      {
        q: 'Which layer should own the interface?',
        a: `The consumer — the high-level policy. If <code>OrderRepository</code> lives in the
            persistence package next to its JDBC implementation, nothing is inverted: the domain still
            points at infrastructure. Put it in the domain package and the arrow flips. This is the
            core of hexagonal architecture — the port belongs to the inside.`,
      },
      {
        q: 'Is field injection a DIP violation?',
        a: `Not strictly — the dependency is still an abstraction. But <code>@Autowired</code> on a field
            hides the dependency from the constructor, so the class can be built in an invalid state and
            cannot be tested without reflection or a container. Constructor injection makes the
            dependency list honest, and lets the field be <code>final</code>.`,
      },
      {
        q: "What's the cost of applying DIP everywhere?",
        a: `An interface with exactly one implementation, forever, is indirection with no payoff — you
            now read two files to follow one call. Apply it where you need a seam: at I/O boundaries,
            at things you must fake in tests, at things you genuinely expect to swap. An in-process
            helper with one caller does not need a port.`,
      },
    ],
  },
]
