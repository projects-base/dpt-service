import type { Topic } from '../types'

/**
 * The DSA pattern curriculum. These are topics rather than a question bank —
 * the problems themselves live on the plan weeks and link out to LeetCode.
 */
export const dsaTopics: Topic[] = [
  { id: 'dsa--arrays-hashing', categoryId: 'dsa', name: 'Arrays & hashing', order: 100,
    blurb: 'Hashing for lookup. Every harder pattern is this with a constraint bolted on.' },
  { id: 'dsa--two-pointers', categoryId: 'dsa', name: 'Two pointers', order: 101,
    blurb: 'The shrink. Sorted input, or a window whose ends move independently.' },
  { id: 'dsa--sliding-window', categoryId: 'dsa', name: 'Sliding window', order: 102,
    blurb: 'Expand right, contract left while the invariant is violated.' },
  { id: 'dsa--binary-search', categoryId: 'dsa', name: 'Binary search', order: 103,
    blurb: 'On an array, and — the part most people never get — on a value range.' },
  { id: 'dsa--strings', categoryId: 'dsa', name: 'Strings', order: 104,
    blurb: 'Microsoft asks more string manipulation than almost anyone.' },
  { id: 'dsa--stacks', categoryId: 'dsa', name: 'Stacks & monotonic stack', order: 105,
    blurb: 'The one trick that turns several O(n²) problems into O(n).' },
  { id: 'dsa--linked-lists', categoryId: 'dsa', name: 'Linked lists', order: 106,
    blurb: 'Pointer surgery, fast/slow, and in-place reversal.' },
  { id: 'dsa--design-ds', categoryId: 'dsa', name: 'Design a data structure', order: 107,
    blurb: 'Build me this structure with these guarantees. Microsoft’s favourite category.' },
  { id: 'dsa--trees', categoryId: 'dsa', name: 'Trees & BSTs', order: 108,
    blurb: 'Traversals until automatic, then LCA, validation, serialisation, path sums.' },
  { id: 'dsa--heaps', categoryId: 'dsa', name: 'Heaps & top-K', order: 109,
    blurb: 'Top-K, running median, scheduling by frequency.' },
  { id: 'dsa--intervals', categoryId: 'dsa', name: 'Intervals & greedy', order: 110,
    blurb: 'The sweep, and knowing when greedy is actually safe.' },
  { id: 'dsa--graphs', categoryId: 'dsa', name: 'Graphs', order: 111,
    blurb: 'BFS/DFS on grids, topological sort, union-find, shortest path.' },
  { id: 'dsa--backtracking', categoryId: 'dsa', name: 'Backtracking', order: 112,
    blurb: 'One skeleton covers subsets, permutations, combinations and word search.' },
  { id: 'dsa--dp', categoryId: 'dsa', name: 'Dynamic programming', order: 113,
    blurb: 'Moderate, not competitive. Own the 1D set cold and the 2D basics honestly.' },
]
