package com.tracker.service.service;

import com.tracker.service.dto.KnowledgeDtos.*;
import com.tracker.service.entity.KnowledgeCategory;
import com.tracker.service.entity.KnowledgeEdge;
import com.tracker.service.entity.KnowledgeNode;
import com.tracker.service.entity.User;
import com.tracker.service.exception.ForbiddenException;
import com.tracker.service.exception.NotFoundException;
import com.tracker.service.repository.KnowledgeCategoryRepository;
import com.tracker.service.repository.KnowledgeEdgeRepository;
import com.tracker.service.repository.KnowledgeNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * The user's knowledge map.
 *
 * This used to live entirely in the browser's localStorage, which meant it was
 * tied to one browser profile and one cache-clear away from being lost. It is
 * now stored per user, so it follows them across devices like everything else.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeService {

    /** nodeKey of the hub node every map hangs off. */
    static final String ROOT_KEY = "root";

    private final KnowledgeNodeRepository nodeRepository;
    private final KnowledgeEdgeRepository edgeRepository;
    private final KnowledgeCategoryRepository categoryRepository;

    /** Colours cycled through for user-invented categories. */
    private static final String[][] PALETTE = {
            {"#1e3a5f", "#1d4ed8", "#93c5fd"},
            {"#3b1f5e", "#7c3aed", "#c4b5fd"},
            {"#1a3a2a", "#059669", "#6ee7b7"},
            {"#3d1f1f", "#dc2626", "#fca5a5"},
            {"#3a2e10", "#d97706", "#fcd34d"},
            {"#1a2a3a", "#0891b2", "#67e8f9"},
            {"#2e1a3a", "#db2777", "#f9a8d4"},
            {"#1a3a1a", "#16a34a", "#86efac"},
    };

    /** The four branches a new map starts with. */
    private record Seed(String key, String label, String icon, String bg, String border, String font) {}

    private static final List<Seed> DEFAULT_CATEGORIES = List.of(
            new Seed("system",  "System Design", "🏗", "#1e1b4b", "#3730a3", "#a5b4fc"),
            new Seed("insta",   "Quick Logic",   "⚡",       "#022c22", "#047857", "#a7f3d0"),
            new Seed("youtube", "Deep Dive",     "🎥", "#4c1d95", "#6d28d9", "#ddd6fe"),
            new Seed("article", "Article",       "📄", "#3f3f46", "#71717a", "#d4d4d8")
    );

    // ── Reading ────────────────────────────────────────────────────────

    /** The caller's whole map, seeding a starter map the first time they open it. */
    @Transactional
    public GraphView getGraph(User user) {
        if (nodeRepository.countByUserId(user.getId()) == 0) {
            seedStarterMap(user);
        }
        return buildGraph(user);
    }

    private GraphView buildGraph(User user) {
        Long userId = user.getId();

        List<NodeView> nodes = nodeRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(KnowledgeNode::getId))
                .map(n -> new NodeView(
                        n.getNodeKey(), n.getLabel(), n.getIcon(), n.getUrl(),
                        n.getCategoryKey(), n.getKind(), n.getNotes(), n.getCreatedDate()))
                .toList();

        List<EdgeView> edges = edgeRepository.findByUserId(userId).stream()
                .map(e -> new EdgeView(e.getFromKey(), e.getToKey()))
                .toList();

        List<CategoryView> categories = categoryRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(KnowledgeCategory::getId))
                .map(KnowledgeService::toView)
                .toList();

        return new GraphView(nodes, edges, categories);
    }

    private static NodeView toNodeView(KnowledgeNode n) {
        return new NodeView(n.getNodeKey(), n.getLabel(), n.getIcon(), n.getUrl(),
                n.getCategoryKey(), n.getKind(), n.getNotes(), n.getCreatedDate());
    }

    private static CategoryView toView(KnowledgeCategory c) {
        return new CategoryView(
                c.getCategoryKey(), c.getLabel(), c.getIcon(), c.getPillarNodeKey(),
                c.getColorBg(), c.getColorBorder(), c.getColorFont(), c.isBuiltIn());
    }

    // ── Seeding ────────────────────────────────────────────────────────

    private void seedStarterMap(User user) {
        nodeRepository.save(KnowledgeNode.builder()
                .nodeKey(ROOT_KEY)
                .label("My Brain")
                .icon("🧠")
                .kind(KnowledgeNode.KIND_ROOT)
                .user(user)
                .build());

        for (Seed seed : DEFAULT_CATEGORIES) {
            String pillarKey = "pillar_" + seed.key();

            categoryRepository.save(KnowledgeCategory.builder()
                    .categoryKey(seed.key())
                    .label(seed.label())
                    .icon(seed.icon())
                    .pillarNodeKey(pillarKey)
                    .colorBg(seed.bg())
                    .colorBorder(seed.border())
                    .colorFont(seed.font())
                    .builtIn(true)
                    .user(user)
                    .build());

            nodeRepository.save(KnowledgeNode.builder()
                    .nodeKey(pillarKey)
                    .label(seed.label())
                    .icon(seed.icon())
                    .categoryKey(seed.key())
                    .kind(KnowledgeNode.KIND_PILLAR)
                    .user(user)
                    .build());

            edgeRepository.save(KnowledgeEdge.builder()
                    .fromKey(ROOT_KEY).toKey(pillarKey).user(user).build());
        }

        log.info("[Knowledge] Seeded starter map for user {}", user.getEmail());
    }

    // ── Nodes ──────────────────────────────────────────────────────────

    /** Files a new resource under a category, linked to that category's pillar. */
    @Transactional
    public NodeView addNode(User user, NodeRequest req) {
        KnowledgeCategory category = requireCategory(user, req.categoryKey());
        String url = blankToNull(req.url());

        // Saving the same link into the same branch twice - a double-clicked
        // "Save" on a portal card, say - should be a no-op rather than
        // littering the map with identical nodes. The same link filed under a
        // different branch is still allowed; that is a deliberate choice.
        if (url != null) {
            for (KnowledgeNode existing :
                    nodeRepository.findByUserIdAndCategoryKey(user.getId(), category.getCategoryKey())) {
                if (url.equalsIgnoreCase(existing.getUrl())) {
                    return toNodeView(existing);
                }
            }
        }

        String nodeKey = "n_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        KnowledgeNode node = nodeRepository.save(KnowledgeNode.builder()
                .nodeKey(nodeKey)
                .label(req.label().trim())
                .icon(category.getIcon())
                .url(url)
                .categoryKey(category.getCategoryKey())
                .kind(KnowledgeNode.KIND_RESOURCE)
                .notes(blankToNull(req.notes()))
                .user(user)
                .build());

        edgeRepository.save(KnowledgeEdge.builder()
                .fromKey(category.getPillarNodeKey())
                .toKey(nodeKey)
                .user(user)
                .build());

        return toNodeView(node);
    }

    @Transactional
    public NodeView updateNode(User user, String nodeKey, NodePatch patch) {
        KnowledgeNode node = requireNode(user, nodeKey);

        if (patch.label() != null && !patch.label().isBlank()) node.setLabel(patch.label().trim());
        if (patch.url() != null)   node.setUrl(blankToNull(patch.url()));
        if (patch.notes() != null) node.setNotes(blankToNull(patch.notes()));

        if (patch.categoryKey() != null && !patch.categoryKey().equals(node.getCategoryKey())) {
            if (!KnowledgeNode.KIND_RESOURCE.equals(node.getKind())) {
                throw new ForbiddenException("Only saved resources can be moved between categories");
            }
            KnowledgeCategory target = requireCategory(user, patch.categoryKey());
            // Re-parent: drop the old pillar link, attach to the new one.
            edgeRepository.deleteAll(incidentEdges(user, nodeKey).stream()
                    .filter(e -> e.getToKey().equals(nodeKey))
                    .toList());
            edgeRepository.save(KnowledgeEdge.builder()
                    .fromKey(target.getPillarNodeKey()).toKey(nodeKey).user(user).build());
            node.setCategoryKey(target.getCategoryKey());
            node.setIcon(target.getIcon());
        }

        return toNodeView(nodeRepository.save(node));
    }

    /** Removes a node and every edge touching it. The root cannot be removed. */
    @Transactional
    public void deleteNode(User user, String nodeKey) {
        KnowledgeNode node = requireNode(user, nodeKey);

        if (KnowledgeNode.KIND_ROOT.equals(node.getKind())) {
            throw new ForbiddenException("The root node cannot be deleted");
        }

        if (KnowledgeNode.KIND_PILLAR.equals(node.getKind())) {
            // Deleting a branch takes its category and everything filed under it.
            deleteCategory(user, node.getCategoryKey());
            return;
        }

        edgeRepository.deleteAll(incidentEdges(user, nodeKey));
        nodeRepository.delete(node);
    }

    // ── Categories ─────────────────────────────────────────────────────

    /** Adds a branch: a category plus its pillar node, hung off the root. */
    @Transactional
    public CategoryView addCategory(User user, CategoryRequest req) {
        String label = req.label().trim();

        boolean duplicate = categoryRepository.findByUserId(user.getId()).stream()
                .anyMatch(c -> c.getLabel().equalsIgnoreCase(label));
        if (duplicate) {
            throw new ForbiddenException("You already have a category called \"" + label + "\"");
        }

        // Make sure the root exists before hanging anything off it.
        if (nodeRepository.countByUserId(user.getId()) == 0) {
            seedStarterMap(user);
        }

        int existingCustom = (int) categoryRepository.findByUserId(user.getId()).stream()
                .filter(c -> !c.isBuiltIn()).count();
        String[] colors = PALETTE[existingCustom % PALETTE.length];

        String categoryKey = "cat_" + slug(label) + "_" + System.currentTimeMillis();
        String pillarKey = "pillar_" + categoryKey;
        String icon = blankToNull(req.icon()) != null ? req.icon().trim() : "📌";

        KnowledgeCategory category = categoryRepository.save(KnowledgeCategory.builder()
                .categoryKey(categoryKey)
                .label(label)
                .icon(icon)
                .pillarNodeKey(pillarKey)
                .colorBg(colors[0])
                .colorBorder(colors[1])
                .colorFont(colors[2])
                .builtIn(false)
                .user(user)
                .build());

        nodeRepository.save(KnowledgeNode.builder()
                .nodeKey(pillarKey)
                .label(label)
                .icon(icon)
                .categoryKey(categoryKey)
                .kind(KnowledgeNode.KIND_PILLAR)
                .user(user)
                .build());

        edgeRepository.save(KnowledgeEdge.builder()
                .fromKey(ROOT_KEY).toKey(pillarKey).user(user).build());

        return toView(category);
    }

    /** Removes a category, its pillar, and every resource filed under it. */
    @Transactional
    public void deleteCategory(User user, String categoryKey) {
        KnowledgeCategory category = requireCategory(user, categoryKey);

        List<KnowledgeNode> members = nodeRepository.findByUserIdAndCategoryKey(user.getId(), categoryKey);
        for (KnowledgeNode member : members) {
            edgeRepository.deleteAll(incidentEdges(user, member.getNodeKey()));
        }
        nodeRepository.deleteAll(members);
        categoryRepository.delete(category);
    }

    // ── Import ─────────────────────────────────────────────────────────

    /**
     * Adopts a map that was sitting in a browser's localStorage.
     *
     * Only runs when the stored map is still the untouched starter map — so a
     * second device with its own stale local copy cannot overwrite real work.
     * Returns true when the import was taken.
     */
    @Transactional
    public boolean importGraph(User user, ImportRequest req) {
        if (req == null || req.nodes() == null || req.nodes().isEmpty()) {
            return false;
        }
        if (!isUntouchedStarterMap(user)) {
            log.info("[Knowledge] Skipping import for {} — map already has content", user.getEmail());
            return false;
        }

        Long userId = user.getId();
        edgeRepository.deleteByUserId(userId);
        nodeRepository.deleteByUserId(userId);
        categoryRepository.deleteByUserId(userId);
        // Flush the deletes before re-inserting: the (user, key) unique
        // constraints would otherwise collide with the rows being replaced.
        nodeRepository.flush();
        categoryRepository.flush();

        if (req.categories() != null) {
            for (CategoryView c : req.categories()) {
                if (isBlank(c.categoryKey())) continue;
                categoryRepository.save(KnowledgeCategory.builder()
                        .categoryKey(c.categoryKey())
                        .label(c.label() != null ? c.label() : c.categoryKey())
                        .icon(c.icon())
                        .pillarNodeKey(c.pillarNodeKey())
                        .colorBg(c.colorBg())
                        .colorBorder(c.colorBorder())
                        .colorFont(c.colorFont())
                        .builtIn(c.builtIn())
                        .user(user)
                        .build());
            }
        }

        for (ImportNode n : req.nodes()) {
            if (isBlank(n.nodeKey()) || isBlank(n.label())) continue;
            nodeRepository.save(KnowledgeNode.builder()
                    .nodeKey(n.nodeKey())
                    .label(n.label())
                    .icon(n.icon())
                    .url(blankToNull(n.url()))
                    .categoryKey(n.categoryKey())
                    .kind(n.kind() != null ? n.kind() : KnowledgeNode.KIND_RESOURCE)
                    .notes(blankToNull(n.notes()))
                    .user(user)
                    .build());
        }

        if (req.edges() != null) {
            for (EdgeView e : req.edges()) {
                if (isBlank(e.from()) || isBlank(e.to())) continue;
                edgeRepository.save(KnowledgeEdge.builder()
                        .fromKey(e.from()).toKey(e.to()).user(user).build());
            }
        }

        log.info("[Knowledge] Imported {} nodes for {}", req.nodes().size(), user.getEmail());
        return true;
    }

    /** True when the map holds nothing but the seeded root and pillars. */
    private boolean isUntouchedStarterMap(User user) {
        return nodeRepository.findByUserId(user.getId()).stream()
                .noneMatch(n -> KnowledgeNode.KIND_RESOURCE.equals(n.getKind()));
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private List<KnowledgeEdge> incidentEdges(User user, String nodeKey) {
        List<KnowledgeEdge> hits = new ArrayList<>();
        for (KnowledgeEdge e : edgeRepository.findByUserId(user.getId())) {
            if (nodeKey.equals(e.getFromKey()) || nodeKey.equals(e.getToKey())) {
                hits.add(e);
            }
        }
        return hits;
    }

    private KnowledgeNode requireNode(User user, String nodeKey) {
        return nodeRepository.findByUserIdAndNodeKey(user.getId(), nodeKey)
                .orElseThrow(() -> new NotFoundException("Node not found: " + nodeKey));
    }

    private KnowledgeCategory requireCategory(User user, String categoryKey) {
        return categoryRepository.findByUserIdAndCategoryKey(user.getId(), categoryKey)
                .orElseThrow(() -> new NotFoundException("Category not found: " + categoryKey));
    }

    private static String slug(String s) {
        String cleaned = s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_");
        cleaned = cleaned.replaceAll("^_+|_+$", "");
        if (cleaned.isEmpty()) cleaned = "branch";
        return cleaned.length() > 24 ? cleaned.substring(0, 24) : cleaned;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String blankToNull(String s) {
        return isBlank(s) ? null : s.trim();
    }
}
