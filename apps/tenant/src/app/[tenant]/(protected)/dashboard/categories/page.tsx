/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Btn, Input, Badge } from '../../../../components/ui';

import {
  useCategoriesFull,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../../../hooks';

import ImageUploader, { getImageUrl } from '@/src/app/components/ui/ImageUploader';
import { Category } from '@repo/types';

function TreeNodes({
  nodes,
  level,
  expanded,
  setExpanded,
  selected,
  onSelect,
  excludeId,
}: any) {
  return nodes.map((node: any) => {
    const isOpen = expanded[node._id];

    // ❌ prevent selecting itself
    if (node._id === excludeId) return null;

    return (
      <div key={node._id}>
        <div
          style={{
            marginLeft: level * 12,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            background: selected === node._id ? '#1a1a2e' : 'transparent',
          }}
          onClick={() => onSelect(node._id)}
        >
          {/* Toggle */}
          {node.children?.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((p: any) => ({
                  ...p,
                  [node._id]: !p[node._id],
                }));
              }}
              style={{ marginRight: 6 }}
            >
              {isOpen ? '▼' : '▶'}
            </span>
          )}

          <span>{node.name}</span>
        </div>

        {isOpen && node.children?.length > 0 && (
          <TreeNodes
            nodes={node.children}
            level={level + 1}
            expanded={expanded}
            setExpanded={setExpanded}
            selected={selected}
            onSelect={onSelect}
            excludeId={excludeId}
          />
        )}
      </div>
    );
  });
}

function CategorySelect({
  categories,
  value,
  onChange,
  excludeId,
  tree,
}: {
  categories: Category[];
  value?: string | null;
  onChange: (id: string | null) => void;
  excludeId?: string; // prevent self चयन
  tree: any[]; // pass the pre-built tree
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // 🔍 filter
  function filterTree(nodes: any[]): any[] {
    return nodes
      .map((node) => {
        const match = node.name.toLowerCase().includes(search.toLowerCase());

        const children = filterTree(node.children || []);

        if (match || children.length) {
          return { ...node, children };
        }

        return null;
      })
      .filter(Boolean);
  }

  const filteredTree = search ? filterTree(tree) : tree;

  return (
    <div style={{ border: '1px solid #222', padding: 8 }}>
      {/* Search */}
      <input
        placeholder="Search category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      />

      {/* Tree */}
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        <TreeNodes
          nodes={filteredTree}
          level={0}
          expanded={expanded}
          setExpanded={setExpanded}
          selected={value}
          onSelect={onChange}
          excludeId={excludeId}
        />
      </div>

      {/* Clear */}
      <div
        style={{ marginTop: 6, cursor: 'pointer', color: '#888' }}
        onClick={() => onChange(null)}
      >
        Clear (No Parent)
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Category Row
// ─────────────────────────────────────────────────────────────
function CategoryRow({
  cat,
  onEdit,
  onDelete,
  isChild,
  onToggleNavbar,
}: {
  cat: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
  isChild?: boolean;
  onToggleNavbar: (id: string, value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isChild
          ? '28px 1fr 100px 100px 120px 140px'
          : '1fr 100px 100px 120px 140px',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        borderBottom: '1px solid #111',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#0f0f1f')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Tree indicator */}
      {isChild && <div style={{ color: '#555', fontSize: 12 }}>└</div>}

      {/* LEFT: Image + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Image */}
        {cat.image ? (
          <img
            src={getImageUrl(cat.image)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              objectFit: 'cover',
              border: '1px solid #222',
            }}
          />
        ) : (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              background: '#1a1a2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#666',
              border: '1px dashed #333',
            }}
          >
            N/A
          </div>
        )}

        {/* Name + Slug */}
        <div>
          <div style={{ fontWeight: 500 }}>{cat.name}</div>
          <div style={{ fontSize: 11, color: '#777' }}>/{cat.slug}</div>
        </div>
      </div>

      {/* Product Count */}
      <div style={{ fontSize: 13 }}>{cat.productCount ?? 0}</div>

      {/* Status */}
      <div>
        <Badge status={cat.isActive ? 'active' : 'inactive'} />
      </div>

      {/* Navbar Toggle */}
      <div
        onClick={() => onToggleNavbar(cat._id, !cat.isNavBarEnable)}
        style={{
          width: 38,
          height: 20,
          borderRadius: 20,
          background: cat.isNavBarEnable ? '#22c55e' : '#333',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: cat.isNavBarEnable ? 20 : 2,
            transition: 'all .2s',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn size="sm" variant="ghost" onClick={() => onEdit(cat)}>
          Edit
        </Btn>

        <Btn
          size="sm"
          variant="danger"
          onClick={() => {
            if (confirm(`Delete "${cat.name}"?`)) {
              onDelete(cat._id);
            }
          }}
        >
          Delete
        </Btn>
      </div>
    </div>
  );
}

function CategoryTree({
  nodes,
  level = 0,
  expanded,
  setExpanded,
  onEdit,
  onDelete,
  onToggleNavbar,
}: any) {
  return nodes.map((cat: any) => {
    const isOpen = expanded[cat._id];

    return (
      <div
        key={cat._id}
        style={{
          marginLeft: level * 16,
        }}
      >
        {/* Row + Toggle */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {cat.children?.length > 0 && (
            <button
              onClick={() =>
                setExpanded((prev: any) => ({
                  ...prev,
                  [cat._id]: !prev[cat._id],
                }))
              }
              style={{
                marginRight: 6,
                cursor: 'pointer',
              }}
            >
              {isOpen ? '▼' : '▶'}
            </button>
          )}

          <CategoryRow
            cat={cat}
            isChild={level > 0}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleNavbar={onToggleNavbar}
          />
        </div>

        {/* Children */}
        {isOpen && cat.children?.length > 0 && (
          <div
            style={{
              borderLeft: '1px solid #222',
              marginLeft: 12,
              paddingLeft: 12,
            }}
          >
            <CategoryTree
              nodes={cat.children}
              level={level + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    );
  });
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────
function CategoryModal({
  initial,
  categories,
  onSave,
  onClose,
  tree,
}: {
  initial?: Partial<Category>;
  categories: Category[];
  onSave: (data: Partial<Category>) => void;
  onClose: () => void;
  tree: any[];
}) {
  const [form, setForm] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    isActive: true,
    image: '',
    ...initial,
  });

  const set = (k: keyof Category, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal">
      <div>
        <h3>{initial?._id ? 'Edit' : 'Create'} Category</h3>

        <Input
          label="Name"
          value={form.name ?? ''}
          onChange={(e) => {
            set('name', e.target.value);
            if (!initial?._id) {
              set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }
          }}
        />

        <Input
          label="Slug"
          value={form.slug ?? ''}
          onChange={(e) => set('slug', e.target.value)}
        />
        <div style={{ margin: '12px 0' }}>
          <label style={{ fontSize: 12, color: '#888' }}>Category Banner</label>

          <ImageUploader
            images={form.image ? [form.image] : []}
            onChange={(urls) => set('image', urls[0] || '')}
            multiple={false} // 👈 banner = single image
          />
        </div>

        <div style={{ marginBottom: 10 }} />

        <CategorySelect
          categories={categories}
          value={form.parentId}
          excludeId={initial?._id} // prevent self-parent
          onChange={(id) => set('parentId', id)}
          tree={tree} // pass the full category list for building the tree
        />
        <div style={{ marginBottom: 10 }} />

        <Btn onClick={() => onSave(form)}>Save</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [editing, setEditing] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: categoriesResponse , isLoading } = useCategoriesFull();

const categories = categoriesResponse?.categories ?? [];
const tree = categoriesResponse?.tree ?? [];

  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  // const topLevel = categories.filter((c: any) => !c.parentId);
  // const children = (id: string) =>
  //   categories.filter((c: any) => c.parentId === id);
  const handleNavbarToggle = (id: string, value: boolean) => {
    updateCat.mutate({
      id,
      data: { isNavBarEnable: value },
    });
  };

  const handleSave = (data: Partial<Category>) => {
    if (editing) {
      updateCat.mutate({
        id: editing._id,
        data,
      });
    } else {
      createCat.mutate(data);
    }
  };

  return (
    <div>
      {(showModal || editing) && (
        <CategoryModal
          initial={editing ?? undefined}
          categories={categories}
          onSave={(data) => {
            handleSave(data);
            setEditing(null);
            setShowModal(false);
          }}
          onClose={() => {
            setEditing(null);
            setShowModal(false);
          }}
          tree={tree} // pass the full category list for building the tree
        />
      )}

      <PageHeader
        title="Categories"
        subtitle={`${categories.length} total`}
        actions={
          <Btn
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            + Add Category
          </Btn>
        }
      />

      <div>
        {isLoading && <div>Loading...</div>}
        {/* {topLevel.map((cat : any) => (
          <div key={cat._id}>
            <CategoryRow
              cat={cat}
              onEdit={(c) => setEditing(c)}
              onDelete={(id) => deleteCat.mutate(id)}
            />

            {children(cat._id).map((child:any) => (
              <CategoryRow
                key={child.id}
                cat={child}
                isChild
                onEdit={(c) => setEditing(c)}
                onDelete={(id) => deleteCat.mutate(id)}
              />
            ))}
          </div>
        ))} */}

        <CategoryTree
          nodes={tree}
          onEdit={(c: any) => setEditing(c)}
          onDelete={(id: any) => deleteCat.mutate(id)}
          expanded={expanded}
          setExpanded={setExpanded}
          onToggleNavbar={handleNavbarToggle}
        />
      </div>
    </div>
  );
}
