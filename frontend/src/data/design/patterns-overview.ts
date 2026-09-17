import type { Question } from '../../types'
import { bonus, tldr, ul } from './highlight'

/**
 * The two questions that sit above the individual patterns.
 *
 * Interviews rarely open with "implement Decorator". They open with "which
 * patterns have you used?" and "how do you decide?" — and those are the ones
 * candidates answer worst, because reciting the catalogue is easy and choosing
 * from it is not.
 */

const TOPIC = 'design--2-design-patterns'

export const patternOverviewQuestions: Question[] = [
  {
    id: 'pat-how-to-choose',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'How do you decide which pattern to use?',
    difficulty: 'medium',
    tags: ['patterns', 'lld'],
    answerHtml:
      tldr(
        'you do not choose a pattern, you name the force that is already hurting — patterns are refactoring targets, not building blocks.',
      ) +
      `<p>The strong answer starts from the problem, so say what the problem sounds like:</p>` +
      ul([
        '"A new type means editing this conditional" → <strong>Strategy</strong> (or polymorphism, which is the same thing without ceremony).',
        '"This object behaves differently depending on its status, and the ifs are nested three deep" → <strong>State</strong>.',
        '"Several things need to know when this happens, and I keep adding calls at the end of the method" → <strong>Observer</strong>.',
        '"The constructor takes seven arguments and four are optional" → <strong>Builder</strong>.',
        '"This library\'s interface is wrong for us" → <strong>Adapter</strong>.',
        '"I need to add behaviour to some instances, not all, and the combinations are multiplying" → <strong>Decorator</strong>.',
        '"Every caller repeats the same five-step dance" → <strong>Facade</strong>, or <strong>Template Method</strong> if the steps vary.',
        '"The request needs queueing, retrying or undoing" → <strong>Command</strong>.',
        '"A tree and a leaf should answer the same question" → <strong>Composite</strong>.',
      ]) +
      `<p>Then the sentence that separates senior from mid: <strong>the pattern is
       usually the second thing you write, not the first.</strong> Write the straightforward version,
       and let the second or third requirement show you where the axis of change actually is. A pattern
       applied on the first requirement is a guess; applied on the third it is evidence.</p>` +
      bonus(
        `Be ready to argue against patterns too, because it is a trap question. Over-patterning is a real
         and common failure: five interfaces with one implementation each, a factory that calls
         <code>new</code>, a strategy that will never have a second strategy. Each one costs a file, an
         indirection and a reader's afternoon. "I'd write the <code>if</code> and revisit it when a
         second case appears" is a legitimate, senior answer — and an interviewer who is listening
         properly prefers it to a recital.`,
      ),
    followUps: [
      {
        q: 'Are design patterns still relevant given modern language features?',
        a: `Some collapsed into syntax and that is the honest answer. Strategy with one method is a
            lambda; Iterator is a for-each; Singleton is a Spring bean; Command is a
            <code>Runnable</code>; Visitor is largely replaced by pattern matching over sealed types.
            What survives is the <em>vocabulary</em> — being able to say "that's a proxy" and have the
            room understand the trade-offs in three words. The catalogue aged; the shared language did not.`,
      },
      {
        q: 'Which pattern do you see misused most?',
        a: `Singleton, comfortably. It is the easiest to implement and the hardest to remove, because
            every caller reaches it through a static and nothing declares the dependency. By the time
            you want to test around it, the reference is in forty files.`,
      },
    ],
  },

  {
    id: 'pat-in-real-code',
    topicId: TOPIC,
    categoryId: 'design',
    prompt: 'Point at patterns in code you have actually used — JDK, Spring, or your own.',
    difficulty: 'easy',
    tags: ['patterns', 'jdk', 'spring'],
    answerHtml:
      tldr(
        'naming patterns in code you use daily proves you recognise them in the wild rather than only in a book.',
      ) +
      `<p><strong>In the JDK</strong></p>` +
      ul([
        '<strong>Decorator</strong> — <code>new BufferedReader(new InputStreamReader(in))</code>, and <code>Collections.unmodifiableList()</code>.',
        '<strong>Adapter</strong> — <code>Arrays.asList()</code>, <code>InputStreamReader</code> (bytes → chars).',
        '<strong>Factory method</strong> — <code>Collection.iterator()</code>, <code>Calendar.getInstance()</code>.',
        '<strong>Flyweight</strong> — <code>Integer.valueOf()</code>\'s −128..127 cache, and String interning.',
        '<strong>Template method</strong> — <code>AbstractList</code>, <code>InputStream.read()</code>.',
        '<strong>Command</strong> — <code>Runnable</code>, <code>Callable</code>, everything an <code>ExecutorService</code> takes.',
        '<strong>Builder</strong> — <code>HttpRequest.newBuilder()</code>, <code>Stream.Builder</code>.',
        '<strong>Strategy</strong> — <code>Comparator</code>, passed to <code>sort</code>.',
      ]) +
      `<p><strong>In Spring</strong></p>` +
      ul([
        '<strong>Proxy</strong> — <code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code>; JDK dynamic proxies or CGLIB subclasses.',
        '<strong>Template method</strong> — <code>JdbcTemplate</code>, <code>RestTemplate</code>, <code>TransactionTemplate</code>. The name is the pattern.',
        '<strong>Chain of responsibility</strong> — the Spring Security filter chain, and <code>javax.servlet.Filter</code>.',
        '<strong>Singleton</strong> — the default bean scope, one per container rather than per classloader.',
        '<strong>Factory</strong> — <code>FactoryBean&lt;T&gt;</code>, <code>BeanFactory</code> itself.',
        '<strong>Observer</strong> — <code>ApplicationEvent</code> and <code>@EventListener</code>.',
        '<strong>Dependency injection</strong> — the container is one large application of DIP.',
      ]) +
      bonus(
        `Best of all is pointing at your own code and explaining the force that drove it — a reviewer
         trusts "we had a conditional that grew a branch per payment provider, so we moved to a
         <code>List&lt;FeeCalculator&gt;</code> injected by Spring" far more than a correct definition
         of Strategy. If you have one of those stories, lead with it.`,
      ),
    followUps: [
      {
        q: 'Which JDK pattern is a cautionary tale?',
        a: `<code>java.io</code>. It is the canonical Decorator example <em>and</em> the canonical
            complaint about it: deep stacks, verbose assembly, an order you have to know, and stack
            traces four wrappers deep. <code>Files.newBufferedReader()</code> exists because the
            assembly was too tedious to leave exposed — a facade over a decorator stack.`,
      },
    ],
  },
]
