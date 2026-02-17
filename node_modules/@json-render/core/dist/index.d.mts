import { z } from 'zod';

/**
 * Confirmation dialog configuration
 */
interface ActionConfirm {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
}
/**
 * Action success handler
 */
type ActionOnSuccess = {
    navigate: string;
} | {
    set: Record<string, unknown>;
} | {
    action: string;
};
/**
 * Action error handler
 */
type ActionOnError = {
    set: Record<string, unknown>;
} | {
    action: string;
};
/**
 * Action binding — maps an event to an action invocation.
 *
 * Used inside the `on` field of a UIElement:
 * ```json
 * { "on": { "press": { "action": "setState", "params": { "statePath": "/x", "value": 1 } } } }
 * ```
 */
interface ActionBinding {
    /** Action name (must be in catalog) */
    action: string;
    /** Parameters to pass to the action handler */
    params?: Record<string, DynamicValue>;
    /** Confirmation dialog before execution */
    confirm?: ActionConfirm;
    /** Handler after successful execution */
    onSuccess?: ActionOnSuccess;
    /** Handler after failed execution */
    onError?: ActionOnError;
}
/**
 * @deprecated Use ActionBinding instead
 */
type Action = ActionBinding;
/**
 * Schema for action confirmation
 */
declare const ActionConfirmSchema: z.ZodObject<{
    title: z.ZodString;
    message: z.ZodString;
    confirmLabel: z.ZodOptional<z.ZodString>;
    cancelLabel: z.ZodOptional<z.ZodString>;
    variant: z.ZodOptional<z.ZodEnum<{
        default: "default";
        danger: "danger";
    }>>;
}, z.core.$strip>;
/**
 * Schema for success handlers
 */
declare const ActionOnSuccessSchema: z.ZodUnion<readonly [z.ZodObject<{
    navigate: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    set: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>, z.ZodObject<{
    action: z.ZodString;
}, z.core.$strip>]>;
/**
 * Schema for error handlers
 */
declare const ActionOnErrorSchema: z.ZodUnion<readonly [z.ZodObject<{
    set: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>, z.ZodObject<{
    action: z.ZodString;
}, z.core.$strip>]>;
/**
 * Full action binding schema
 */
declare const ActionBindingSchema: z.ZodObject<{
    action: z.ZodString;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull, z.ZodObject<{
        $state: z.ZodString;
    }, z.core.$strip>]>>>;
    confirm: z.ZodOptional<z.ZodObject<{
        title: z.ZodString;
        message: z.ZodString;
        confirmLabel: z.ZodOptional<z.ZodString>;
        cancelLabel: z.ZodOptional<z.ZodString>;
        variant: z.ZodOptional<z.ZodEnum<{
            default: "default";
            danger: "danger";
        }>>;
    }, z.core.$strip>>;
    onSuccess: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        navigate: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        set: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodObject<{
        action: z.ZodString;
    }, z.core.$strip>]>>;
    onError: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        set: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodObject<{
        action: z.ZodString;
    }, z.core.$strip>]>>;
}, z.core.$strip>;
/**
 * @deprecated Use ActionBindingSchema instead
 */
declare const ActionSchema: z.ZodObject<{
    action: z.ZodString;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull, z.ZodObject<{
        $state: z.ZodString;
    }, z.core.$strip>]>>>;
    confirm: z.ZodOptional<z.ZodObject<{
        title: z.ZodString;
        message: z.ZodString;
        confirmLabel: z.ZodOptional<z.ZodString>;
        cancelLabel: z.ZodOptional<z.ZodString>;
        variant: z.ZodOptional<z.ZodEnum<{
            default: "default";
            danger: "danger";
        }>>;
    }, z.core.$strip>>;
    onSuccess: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        navigate: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        set: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodObject<{
        action: z.ZodString;
    }, z.core.$strip>]>>;
    onError: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        set: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodObject<{
        action: z.ZodString;
    }, z.core.$strip>]>>;
}, z.core.$strip>;
/**
 * Action handler function signature
 */
type ActionHandler<TParams = Record<string, unknown>, TResult = unknown> = (params: TParams) => Promise<TResult> | TResult;
/**
 * Action definition in catalog
 */
interface ActionDefinition<TParams = Record<string, unknown>> {
    /** Zod schema for params validation */
    params?: z.ZodType<TParams>;
    /** Description for AI */
    description?: string;
}
/**
 * Resolved action with all dynamic values resolved
 */
interface ResolvedAction {
    action: string;
    params: Record<string, unknown>;
    confirm?: ActionConfirm;
    onSuccess?: ActionOnSuccess;
    onError?: ActionOnError;
}
/**
 * Resolve all dynamic values in an action binding
 */
declare function resolveAction(binding: ActionBinding, stateModel: StateModel): ResolvedAction;
/**
 * Interpolate ${path} expressions in a string
 */
declare function interpolateString(template: string, stateModel: StateModel): string;
/**
 * Context for action execution
 */
interface ActionExecutionContext {
    /** The resolved action */
    action: ResolvedAction;
    /** The action handler from the host */
    handler: ActionHandler;
    /** Function to update state model */
    setState: (path: string, value: unknown) => void;
    /** Function to navigate */
    navigate?: (path: string) => void;
    /** Function to execute another action */
    executeAction?: (name: string) => Promise<void>;
}
/**
 * Execute an action with all callbacks
 */
declare function executeAction(ctx: ActionExecutionContext): Promise<void>;
/**
 * Helper to create action bindings
 */
declare const actionBinding: {
    /** Create a simple action binding */
    simple: (actionName: string, params?: Record<string, DynamicValue>) => ActionBinding;
    /** Create an action binding with confirmation */
    withConfirm: (actionName: string, confirm: ActionConfirm, params?: Record<string, DynamicValue>) => ActionBinding;
    /** Create an action binding with success handler */
    withSuccess: (actionName: string, onSuccess: ActionOnSuccess, params?: Record<string, DynamicValue>) => ActionBinding;
};
/**
 * @deprecated Use actionBinding instead
 */
declare const action: {
    /** Create a simple action binding */
    simple: (actionName: string, params?: Record<string, DynamicValue>) => ActionBinding;
    /** Create an action binding with confirmation */
    withConfirm: (actionName: string, confirm: ActionConfirm, params?: Record<string, DynamicValue>) => ActionBinding;
    /** Create an action binding with success handler */
    withSuccess: (actionName: string, onSuccess: ActionOnSuccess, params?: Record<string, DynamicValue>) => ActionBinding;
};

/**
 * Dynamic value - can be a literal or a `{ $state }` reference to the state model.
 *
 * Used in action params and validation args where values can either be
 * hardcoded or resolved from state at runtime.
 */
type DynamicValue<T = unknown> = T | {
    $state: string;
};
/**
 * Dynamic string value
 */
type DynamicString = DynamicValue<string>;
/**
 * Dynamic number value
 */
type DynamicNumber = DynamicValue<number>;
/**
 * Dynamic boolean value
 */
type DynamicBoolean = DynamicValue<boolean>;
/**
 * Zod schema for dynamic values
 */
declare const DynamicValueSchema: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull, z.ZodObject<{
    $state: z.ZodString;
}, z.core.$strip>]>;
declare const DynamicStringSchema: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    $state: z.ZodString;
}, z.core.$strip>]>;
declare const DynamicNumberSchema: z.ZodUnion<readonly [z.ZodNumber, z.ZodObject<{
    $state: z.ZodString;
}, z.core.$strip>]>;
declare const DynamicBooleanSchema: z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
    $state: z.ZodString;
}, z.core.$strip>]>;
/**
 * Base UI element structure for v2
 */
interface UIElement<T extends string = string, P = Record<string, unknown>> {
    /** Component type from the catalog */
    type: T;
    /** Component props */
    props: P;
    /** Child element keys (flat structure) */
    children?: string[];
    /** Visibility condition */
    visible?: VisibilityCondition;
    /** Event bindings — maps event names to action bindings */
    on?: Record<string, ActionBinding | ActionBinding[]>;
    /** Repeat children once per item in a state array */
    repeat?: {
        statePath: string;
        key?: string;
    };
}
/**
 * Element with key and parentKey for use with flatToTree.
 * When elements are in an array (not a keyed map), key and parentKey
 * are needed to establish identity and parent-child relationships.
 */
interface FlatElement<T extends string = string, P = Record<string, unknown>> extends UIElement<T, P> {
    /** Unique key identifying this element */
    key: string;
    /** Parent element key (null for root) */
    parentKey?: string | null;
}
/**
 * Shared comparison operators for visibility conditions.
 *
 * Use at most ONE comparison operator per condition. If multiple are
 * provided, only the first matching one is evaluated (precedence:
 * eq > neq > gt > gte > lt > lte). With no operator, truthiness is checked.
 *
 * `not` inverts the final result of whichever operator (or truthiness
 * check) is used.
 */
type ComparisonOperators = {
    eq?: unknown;
    neq?: unknown;
    gt?: number | {
        $state: string;
    };
    gte?: number | {
        $state: string;
    };
    lt?: number | {
        $state: string;
    };
    lte?: number | {
        $state: string;
    };
    not?: true;
};
/**
 * A single state-based condition.
 * Resolves `$state` to a value from the state model, then applies the operator.
 * Without an operator, checks truthiness.
 *
 * When `not` is `true`, the result of the entire condition is inverted.
 * For example `{ $state: "/count", gt: 5, not: true }` means "NOT greater than 5".
 */
type StateCondition = {
    $state: string;
} & ComparisonOperators;
/**
 * A condition that resolves `$item` to a field on the current repeat item.
 * Only meaningful inside a `repeat` scope.
 *
 * Use `""` to reference the whole item, or `"field"` for a specific field.
 */
type ItemCondition = {
    $item: string;
} & ComparisonOperators;
/**
 * A condition that resolves `$index` to the current repeat array index.
 * Only meaningful inside a `repeat` scope.
 */
type IndexCondition = {
    $index: true;
} & ComparisonOperators;
/** A single visibility condition (state, item, or index). */
type SingleCondition = StateCondition | ItemCondition | IndexCondition;
/**
 * AND wrapper — all child conditions must be true.
 * This is the explicit form of the implicit array AND (`SingleCondition[]`).
 * Unlike the implicit form, `$and` supports nested `$or` and `$and` conditions.
 */
type AndCondition = {
    $and: VisibilityCondition[];
};
/**
 * OR wrapper — at least one child condition must be true.
 */
type OrCondition = {
    $or: VisibilityCondition[];
};
/**
 * Visibility condition types.
 * - `boolean` — always/never
 * - `SingleCondition` — single condition (`$state`, `$item`, or `$index`)
 * - `SingleCondition[]` — implicit AND (all must be true)
 * - `AndCondition` — `{ $and: [...] }`, explicit AND (all must be true)
 * - `OrCondition` — `{ $or: [...] }`, at least one must be true
 */
type VisibilityCondition = boolean | SingleCondition | SingleCondition[] | AndCondition | OrCondition;
/**
 * Flat UI tree structure (optimized for LLM generation)
 */
interface Spec {
    /** Root element key */
    root: string;
    /** Flat map of elements by key */
    elements: Record<string, UIElement>;
    /** Optional initial state to seed the state model.
     *  Components using statePath will read from / write to this state. */
    state?: Record<string, unknown>;
}
/**
 * State model type
 */
type StateModel = Record<string, unknown>;
/**
 * Component schema definition using Zod
 */
type ComponentSchema = z.ZodType<Record<string, unknown>>;
/**
 * Validation mode for catalog validation
 */
type ValidationMode = "strict" | "warn" | "ignore";
/**
 * JSON patch operation types (RFC 6902)
 */
type PatchOp = "add" | "remove" | "replace" | "move" | "copy" | "test";
/**
 * JSON patch operation (RFC 6902)
 */
interface JsonPatch {
    op: PatchOp;
    path: string;
    /** Required for add, replace, test */
    value?: unknown;
    /** Required for move, copy (source location) */
    from?: string;
}
/**
 * Resolve a dynamic value against a state model
 */
declare function resolveDynamicValue<T>(value: DynamicValue<T>, stateModel: StateModel): T | undefined;
/**
 * Get a value from an object by JSON Pointer path (RFC 6901)
 */
declare function getByPath(obj: unknown, path: string): unknown;
/**
 * Set a value in an object by JSON Pointer path (RFC 6901).
 * Automatically creates arrays when the path segment is a numeric index.
 */
declare function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void;
/**
 * Add a value per RFC 6902 "add" semantics.
 * For objects: create-or-replace the member.
 * For arrays: insert before the given index, or append if "-".
 */
declare function addByPath(obj: Record<string, unknown>, path: string, value: unknown): void;
/**
 * Remove a value per RFC 6902 "remove" semantics.
 * For objects: delete the property.
 * For arrays: splice out the element at the given index.
 */
declare function removeByPath(obj: Record<string, unknown>, path: string): void;
/**
 * Find a form value from params and/or state.
 * Useful in action handlers to locate form input values regardless of path format.
 *
 * Checks in order:
 * 1. Direct param key (if not a path reference)
 * 2. Param keys ending with the field name
 * 3. State keys ending with the field name (dot notation)
 * 4. State path using getByPath (slash notation)
 *
 * @example
 * // Find "name" from params or state
 * const name = findFormValue("name", params, state);
 *
 * // Will find from: params.name, params["form.name"], state["form.name"], or getByPath(state, "name")
 */
declare function findFormValue(fieldName: string, params?: Record<string, unknown>, state?: Record<string, unknown>): unknown;
/**
 * A SpecStream line - a single patch operation in the stream.
 */
type SpecStreamLine = JsonPatch;
/**
 * Parse a single SpecStream line into a patch operation.
 * Returns null if the line is invalid or empty.
 *
 * SpecStream is json-render's streaming format where each line is a JSON patch
 * operation that progressively builds up the final spec.
 */
declare function parseSpecStreamLine(line: string): SpecStreamLine | null;
/**
 * Apply a single RFC 6902 JSON Patch operation to an object.
 * Mutates the object in place.
 *
 * Supports all six RFC 6902 operations: add, remove, replace, move, copy, test.
 *
 * @throws {Error} If a "test" operation fails (value mismatch).
 */
declare function applySpecStreamPatch<T extends Record<string, unknown>>(obj: T, patch: SpecStreamLine): T;
/**
 * Apply a single RFC 6902 JSON Patch operation to a Spec.
 * Mutates the spec in place and returns it.
 *
 * This is a typed convenience wrapper around `applySpecStreamPatch` that
 * accepts a `Spec` directly without requiring a cast to `Record<string, unknown>`.
 *
 * Note: This mutates the spec. For React state updates, spread the result
 * to create a new reference: `setSpec({ ...applySpecPatch(spec, patch) })`.
 *
 * @example
 * let spec: Spec = { root: "", elements: {} };
 * applySpecPatch(spec, { op: "add", path: "/root", value: "main" });
 */
declare function applySpecPatch(spec: Spec, patch: SpecStreamLine): Spec;
/**
 * Convert a nested (tree-structured) spec into the flat `Spec` format used
 * by json-render renderers.
 *
 * In the nested format each node has inline `children` as an array of child
 * objects. This function walks the tree, assigns auto-generated keys
 * (`el-0`, `el-1`, ...), and produces a flat `{ root, elements, state }` spec.
 *
 * The top-level `state` field (if present on the root node) is hoisted to
 * `spec.state`.
 *
 * @example
 * ```ts
 * const nested = {
 *   type: "Card",
 *   props: { title: "Hello" },
 *   children: [
 *     { type: "Text", props: { content: "World" } },
 *   ],
 *   state: { count: 0 },
 * };
 * const spec = nestedToFlat(nested);
 * // {
 * //   root: "el-0",
 * //   elements: {
 * //     "el-0": { type: "Card", props: { title: "Hello" }, children: ["el-1"] },
 * //     "el-1": { type: "Text", props: { content: "World" }, children: [] },
 * //   },
 * //   state: { count: 0 },
 * // }
 * ```
 */
declare function nestedToFlat(nested: Record<string, unknown>): Spec;
/**
 * Compile a SpecStream string into a JSON object.
 * Each line should be a patch operation.
 *
 * @example
 * const stream = `{"op":"add","path":"/name","value":"Alice"}
 * {"op":"add","path":"/age","value":30}`;
 * const result = compileSpecStream(stream);
 * // { name: "Alice", age: 30 }
 */
declare function compileSpecStream<T extends Record<string, unknown> = Record<string, unknown>>(stream: string, initial?: T): T;
/**
 * Streaming SpecStream compiler.
 * Useful for processing SpecStream data as it streams in from AI.
 *
 * @example
 * const compiler = createSpecStreamCompiler<MySpec>();
 *
 * // As chunks arrive:
 * const { result, newPatches } = compiler.push(chunk);
 * if (newPatches.length > 0) {
 *   updateUI(result);
 * }
 *
 * // When done:
 * const finalResult = compiler.getResult();
 */
interface SpecStreamCompiler<T> {
    /** Push a chunk of text. Returns the current result and any new patches applied. */
    push(chunk: string): {
        result: T;
        newPatches: SpecStreamLine[];
    };
    /** Get the current compiled result */
    getResult(): T;
    /** Get all patches that have been applied */
    getPatches(): SpecStreamLine[];
    /** Reset the compiler to initial state */
    reset(initial?: Partial<T>): void;
}
/**
 * Create a streaming SpecStream compiler.
 *
 * SpecStream is json-render's streaming format. AI outputs patch operations
 * line by line, and this compiler progressively builds the final spec.
 *
 * @example
 * const compiler = createSpecStreamCompiler<TimelineSpec>();
 *
 * // Process streaming response
 * const reader = response.body.getReader();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *
 *   const { result, newPatches } = compiler.push(decoder.decode(value));
 *   if (newPatches.length > 0) {
 *     setSpec(result); // Update UI with partial result
 *   }
 * }
 */
declare function createSpecStreamCompiler<T = Record<string, unknown>>(initial?: Partial<T>): SpecStreamCompiler<T>;
/**
 * Callbacks for the mixed stream parser.
 */
interface MixedStreamCallbacks {
    /** Called when a JSONL patch line is parsed */
    onPatch: (patch: SpecStreamLine) => void;
    /** Called when a text (non-JSONL) line is received */
    onText: (text: string) => void;
}
/**
 * A stateful parser for mixed streams that contain both text and JSONL patches.
 * Used in chat + GenUI scenarios where an LLM responds with conversational text
 * interleaved with json-render JSONL patch operations.
 */
interface MixedStreamParser {
    /** Push a chunk of streamed data. Calls onPatch/onText for each complete line. */
    push(chunk: string): void;
    /** Flush any remaining buffered content. Call when the stream ends. */
    flush(): void;
}
/**
 * Create a parser for mixed text + JSONL streams.
 *
 * In chat + GenUI scenarios, an LLM streams a response that contains both
 * conversational text and json-render JSONL patch lines. This parser buffers
 * incoming chunks, splits them into lines, and classifies each line as either
 * a JSONL patch (via `parseSpecStreamLine`) or plain text.
 *
 * @example
 * const parser = createMixedStreamParser({
 *   onText: (text) => appendToMessage(text),
 *   onPatch: (patch) => applySpecPatch(spec, patch),
 * });
 *
 * // As chunks arrive from the stream:
 * for await (const chunk of stream) {
 *   parser.push(chunk);
 * }
 * parser.flush();
 */
declare function createMixedStreamParser(callbacks: MixedStreamCallbacks): MixedStreamParser;
/**
 * Minimal chunk shape compatible with the AI SDK's `UIMessageChunk`.
 *
 * Defined here so that `@json-render/core` has no dependency on the `ai`
 * package. The discriminated union covers the three text-related chunk types
 * the transform inspects; all other chunk types pass through via the fallback.
 */
type StreamChunk = {
    type: "text-start";
    id: string;
    [k: string]: unknown;
} | {
    type: "text-delta";
    id: string;
    delta: string;
    [k: string]: unknown;
} | {
    type: "text-end";
    id: string;
    [k: string]: unknown;
} | {
    type: string;
    [k: string]: unknown;
};
/**
 * Creates a `TransformStream` that intercepts AI SDK UI message stream chunks
 * and classifies text content as either prose or json-render JSONL patches.
 *
 * Two classification modes:
 *
 * 1. **Fence mode** (preferred): Lines between ` ```spec ` and ` ``` ` are
 *    parsed as JSONL patches. Fence delimiters are swallowed (not emitted).
 * 2. **Heuristic mode** (backward compat): Outside of fences, lines starting
 *    with `{` are buffered and tested with `parseSpecStreamLine`. Valid patches
 *    are emitted as {@link SPEC_DATA_PART_TYPE} parts; everything else is
 *    flushed as text.
 *
 * Non-text chunks (tool events, step markers, etc.) are passed through unchanged.
 *
 * @example
 * ```ts
 * import { createJsonRenderTransform } from "@json-render/core";
 * import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
 *
 * const stream = createUIMessageStream({
 *   execute: async ({ writer }) => {
 *     writer.merge(
 *       result.toUIMessageStream().pipeThrough(createJsonRenderTransform()),
 *     );
 *   },
 * });
 * return createUIMessageStreamResponse({ stream });
 * ```
 */
declare function createJsonRenderTransform(): TransformStream<StreamChunk, StreamChunk>;
/**
 * The key registered in `AppDataParts` for json-render specs.
 * The AI SDK automatically prefixes this with `"data-"` on the wire,
 * so the actual stream chunk type is `"data-spec"` (see {@link SPEC_DATA_PART_TYPE}).
 *
 * @example
 * ```ts
 * import { SPEC_DATA_PART, type SpecDataPart } from "@json-render/core";
 * type AppDataParts = { [SPEC_DATA_PART]: SpecDataPart };
 * ```
 */
declare const SPEC_DATA_PART: "spec";
/**
 * The wire-format type string as it appears in stream chunks and message parts.
 * This is `"data-"` + {@link SPEC_DATA_PART} — i.e. `"data-spec"`.
 *
 * Use this constant when filtering message parts or enqueuing stream chunks.
 */
declare const SPEC_DATA_PART_TYPE: "data-spec";
/**
 * Discriminated union for the payload of a {@link SPEC_DATA_PART_TYPE} SSE part.
 *
 * - `"patch"`: A single RFC 6902 JSON Patch operation (streaming, progressive UI).
 * - `"flat"`: A complete flat spec with `root`, `elements`, and optional `state`.
 * - `"nested"`: A complete nested spec (tree structure — schema depends on catalog).
 */
type SpecDataPart = {
    type: "patch";
    patch: JsonPatch;
} | {
    type: "flat";
    spec: Spec;
} | {
    type: "nested";
    spec: Record<string, unknown>;
};
/**
 * Convenience wrapper that pipes an AI SDK UI message stream through the
 * json-render transform, classifying text as prose or JSONL patches.
 *
 * Eliminates the need for manual `pipeThrough(createJsonRenderTransform())`
 * and the associated type cast.
 *
 * @example
 * ```ts
 * import { pipeJsonRender } from "@json-render/core";
 *
 * const stream = createUIMessageStream({
 *   execute: async ({ writer }) => {
 *     writer.merge(pipeJsonRender(result.toUIMessageStream()));
 *   },
 * });
 * return createUIMessageStreamResponse({ stream });
 * ```
 */
declare function pipeJsonRender<T = StreamChunk>(stream: ReadableStream<T>): ReadableStream<T>;

/**
 * Visibility condition schema.
 *
 * Lazy because `OrCondition` can recursively contain `VisibilityCondition`.
 */
declare const VisibilityConditionSchema: z.ZodType<VisibilityCondition>;
/**
 * Context for evaluating visibility conditions.
 *
 * `repeatItem` and `repeatIndex` are only present inside a `repeat` scope
 * and enable `$item` / `$index` conditions.
 */
interface VisibilityContext {
    stateModel: StateModel;
    /** The current repeat item (set inside a repeat scope). */
    repeatItem?: unknown;
    /** The current repeat array index (set inside a repeat scope). */
    repeatIndex?: number;
}
/**
 * Evaluate a visibility condition.
 *
 * - `undefined` → visible
 * - `boolean` → that value
 * - `SingleCondition` → evaluate single condition
 * - `SingleCondition[]` → implicit AND (all must be true)
 * - `AndCondition` → `{ $and: [...] }`, explicit AND
 * - `OrCondition` → `{ $or: [...] }`, at least one must be true
 */
declare function evaluateVisibility(condition: VisibilityCondition | undefined, ctx: VisibilityContext): boolean;
/**
 * Helper to create visibility conditions.
 */
declare const visibility: {
    /** Always visible */
    always: true;
    /** Never visible */
    never: false;
    /** Visible when state path is truthy */
    when: (path: string) => StateCondition;
    /** Visible when state path is falsy */
    unless: (path: string) => StateCondition;
    /** Equality check */
    eq: (path: string, value: unknown) => StateCondition;
    /** Not equal check */
    neq: (path: string, value: unknown) => StateCondition;
    /** Greater than */
    gt: (path: string, value: number | {
        $state: string;
    }) => StateCondition;
    /** Greater than or equal */
    gte: (path: string, value: number | {
        $state: string;
    }) => StateCondition;
    /** Less than */
    lt: (path: string, value: number | {
        $state: string;
    }) => StateCondition;
    /** Less than or equal */
    lte: (path: string, value: number | {
        $state: string;
    }) => StateCondition;
    /** AND multiple conditions */
    and: (...conditions: VisibilityCondition[]) => AndCondition;
    /** OR multiple conditions */
    or: (...conditions: VisibilityCondition[]) => OrCondition;
};

/**
 * A prop expression that resolves to a value based on state.
 *
 * - `{ $state: string }` reads a value from the global state model
 * - `{ $item: string }` reads a field from the current repeat item
 *    (relative path into the item object; use `""` for the whole item)
 * - `{ $index: true }` returns the current repeat array index. Uses `true`
 *    as a sentinel flag because the index is a scalar with no sub-path to
 *    navigate — unlike `$item` which needs a path into the item object.
 * - `{ $bindState: string }` two-way binding to a global state path —
 *    resolves to the value at the path (like `$state`) AND exposes the
 *    resolved path so the component can write back.
 * - `{ $bindItem: string }` two-way binding to a field on the current
 *    repeat item — resolves via `repeatBasePath + path` and exposes the
 *    absolute state path for write-back.
 * - `{ $cond, $then, $else }` conditionally picks a value
 * - Any other value is a literal (passthrough)
 */
type PropExpression<T = unknown> = T | {
    $state: string;
} | {
    $item: string;
} | {
    $index: true;
} | {
    $bindState: string;
} | {
    $bindItem: string;
} | {
    $cond: VisibilityCondition;
    $then: PropExpression<T>;
    $else: PropExpression<T>;
};
/**
 * Context for resolving prop expressions.
 * Extends {@link VisibilityContext} with an optional `repeatBasePath` used
 * to resolve `$bindItem` paths to absolute state paths.
 */
interface PropResolutionContext extends VisibilityContext {
    /** Absolute state path to the current repeat item (e.g. "/todos/0"). Set inside repeat scopes. */
    repeatBasePath?: string;
}
/**
 * Resolve a single prop value that may contain expressions.
 * Handles $state, $item, $index, $bindState, $bindItem, and $cond/$then/$else in a single pass.
 */
declare function resolvePropValue(value: unknown, ctx: PropResolutionContext): unknown;
/**
 * Resolve all prop values in an element's props object.
 * Returns a new props object with all expressions resolved.
 */
declare function resolveElementProps(props: Record<string, unknown>, ctx: PropResolutionContext): Record<string, unknown>;
/**
 * Scan an element's raw props for `$bindState` / `$bindItem` expressions
 * and return a map of prop name → resolved absolute state path.
 *
 * This is called **before** `resolveElementProps` so the component can
 * receive both the resolved value (in `props`) and the write-back path
 * (in `bindings`).
 *
 * @example
 * ```ts
 * const rawProps = { value: { $bindState: "/form/email" }, label: "Email" };
 * const bindings = resolveBindings(rawProps, ctx);
 * // bindings = { value: "/form/email" }
 * ```
 */
declare function resolveBindings(props: Record<string, unknown>, ctx: PropResolutionContext): Record<string, string> | undefined;
/**
 * Resolve a single action parameter value.
 *
 * Like {@link resolvePropValue} but with special handling for path-valued
 * params: `{ $item: "field" }` resolves to an **absolute state path**
 * (e.g. `/todos/0/field`) instead of the field's value, so the path can
 * be passed to `setState` / `pushState` / `removeState`.
 *
 * - `{ $item: "field" }` → absolute state path via `repeatBasePath`
 * - `{ $index: true }` → current repeat index (number)
 * - Everything else delegates to `resolvePropValue` ($state, $cond, literals).
 */
declare function resolveActionParam(value: unknown, ctx: PropResolutionContext): unknown;

/**
 * Validation check definition
 */
interface ValidationCheck {
    /** Validation type (built-in or from catalog) */
    type: string;
    /** Additional arguments for the validation */
    args?: Record<string, DynamicValue>;
    /** Error message to display if check fails */
    message: string;
}
/**
 * Validation configuration for a field
 */
interface ValidationConfig {
    /** Array of checks to run */
    checks?: ValidationCheck[];
    /** When to run validation */
    validateOn?: "change" | "blur" | "submit";
    /** Condition for when validation is enabled */
    enabled?: VisibilityCondition;
}
/**
 * Schema for validation check
 */
declare const ValidationCheckSchema: z.ZodObject<{
    type: z.ZodString;
    args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull, z.ZodObject<{
        $state: z.ZodString;
    }, z.core.$strip>]>>>;
    message: z.ZodString;
}, z.core.$strip>;
/**
 * Schema for validation config
 */
declare const ValidationConfigSchema: z.ZodObject<{
    checks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull, z.ZodObject<{
            $state: z.ZodString;
        }, z.core.$strip>]>>>;
        message: z.ZodString;
    }, z.core.$strip>>>;
    validateOn: z.ZodOptional<z.ZodEnum<{
        change: "change";
        blur: "blur";
        submit: "submit";
    }>>;
    enabled: z.ZodOptional<z.ZodType<VisibilityCondition, unknown, z.core.$ZodTypeInternals<VisibilityCondition, unknown>>>;
}, z.core.$strip>;
/**
 * Validation function signature
 */
type ValidationFunction = (value: unknown, args?: Record<string, unknown>) => boolean;
/**
 * Validation function definition in catalog
 */
interface ValidationFunctionDefinition {
    /** The validation function */
    validate: ValidationFunction;
    /** Description for AI */
    description?: string;
}
/**
 * Built-in validation functions
 */
declare const builtInValidationFunctions: Record<string, ValidationFunction>;
/**
 * Validation result for a single check
 */
interface ValidationCheckResult {
    type: string;
    valid: boolean;
    message: string;
}
/**
 * Full validation result for a field
 */
interface ValidationResult {
    valid: boolean;
    errors: string[];
    checks: ValidationCheckResult[];
}
/**
 * Context for running validation
 */
interface ValidationContext {
    /** Current value to validate */
    value: unknown;
    /** Full data model for resolving paths */
    stateModel: StateModel;
    /** Custom validation functions from catalog */
    customFunctions?: Record<string, ValidationFunction>;
}
/**
 * Run a single validation check
 */
declare function runValidationCheck(check: ValidationCheck, ctx: ValidationContext): ValidationCheckResult;
/**
 * Run all validation checks for a field
 */
declare function runValidation(config: ValidationConfig, ctx: ValidationContext): ValidationResult;
/**
 * Helper to create validation checks
 */
declare const check: {
    required: (message?: string) => ValidationCheck;
    email: (message?: string) => ValidationCheck;
    minLength: (min: number, message?: string) => ValidationCheck;
    maxLength: (max: number, message?: string) => ValidationCheck;
    pattern: (pattern: string, message?: string) => ValidationCheck;
    min: (min: number, message?: string) => ValidationCheck;
    max: (max: number, message?: string) => ValidationCheck;
    url: (message?: string) => ValidationCheck;
    matches: (otherPath: string, message?: string) => ValidationCheck;
};

/**
 * Severity level for validation issues.
 */
type SpecIssueSeverity = "error" | "warning";
/**
 * A single validation issue found in a spec.
 */
interface SpecIssue {
    /** Severity: errors should be fixed, warnings are informational */
    severity: SpecIssueSeverity;
    /** Human-readable description of the issue */
    message: string;
    /** The element key where the issue was found (if applicable) */
    elementKey?: string;
    /** Machine-readable issue code for programmatic handling */
    code: "missing_root" | "root_not_found" | "missing_child" | "visible_in_props" | "orphaned_element" | "empty_spec" | "on_in_props" | "repeat_in_props";
}
/**
 * Result of spec structural validation.
 */
interface SpecValidationIssues {
    /** Whether the spec passed validation (no errors; warnings are OK) */
    valid: boolean;
    /** List of issues found */
    issues: SpecIssue[];
}
/**
 * Options for validateSpec.
 */
interface ValidateSpecOptions {
    /**
     * Whether to check for orphaned elements (elements not reachable from root).
     * Defaults to false since orphans are harmless (just unused).
     */
    checkOrphans?: boolean;
}
/**
 * Validate a spec for structural integrity.
 *
 * Checks for common AI-generation errors:
 * - Missing or empty root
 * - Root element not found in elements map
 * - Children referencing non-existent elements
 * - `visible` placed inside `props` instead of on the element
 * - Orphaned elements (optional)
 *
 * @example
 * ```ts
 * const result = validateSpec(spec);
 * if (!result.valid) {
 *   console.log("Spec errors:", result.issues);
 * }
 * ```
 */
declare function validateSpec(spec: Spec, options?: ValidateSpecOptions): SpecValidationIssues;
/**
 * Auto-fix common spec issues in-place and return a corrected copy.
 *
 * Currently fixes:
 * - `visible` inside `props` → moved to element level
 * - `on` inside `props` → moved to element level
 * - `repeat` inside `props` → moved to element level
 *
 * Returns the fixed spec and a list of fixes applied.
 */
declare function autoFixSpec(spec: Spec): {
    spec: Spec;
    fixes: string[];
};
/**
 * Format validation issues into a human-readable string suitable for
 * inclusion in a repair prompt sent back to the AI.
 */
declare function formatSpecIssues(issues: SpecIssue[]): string;

/**
 * Schema builder primitives
 */
interface SchemaBuilder {
    /** String type */
    string(): SchemaType<"string">;
    /** Number type */
    number(): SchemaType<"number">;
    /** Boolean type */
    boolean(): SchemaType<"boolean">;
    /** Array of type */
    array<T extends SchemaType>(item: T): SchemaType<"array", T>;
    /** Object with shape */
    object<T extends Record<string, SchemaType>>(shape: T): SchemaType<"object", T>;
    /** Record/map with value type */
    record<T extends SchemaType>(value: T): SchemaType<"record", T>;
    /** Any type */
    any(): SchemaType<"any">;
    /** Placeholder for user-provided Zod schema */
    zod(): SchemaType<"zod">;
    /** Reference to catalog key (e.g., 'catalog.components') */
    ref(path: string): SchemaType<"ref", string>;
    /** Props from referenced catalog entry */
    propsOf(path: string): SchemaType<"propsOf", string>;
    /** Map of named entries with shared shape */
    map<T extends Record<string, SchemaType>>(entryShape: T): SchemaType<"map", T>;
    /** Optional modifier */
    optional(): {
        optional: true;
    };
}
/**
 * Schema type representation
 */
interface SchemaType<TKind extends string = string, TInner = unknown> {
    kind: TKind;
    inner?: TInner;
    optional?: boolean;
}
/**
 * Schema definition shape
 */
interface SchemaDefinition<TSpec extends SchemaType = SchemaType, TCatalog extends SchemaType = SchemaType> {
    /** What the AI-generated spec looks like */
    spec: TSpec;
    /** What the catalog must provide */
    catalog: TCatalog;
}
/**
 * Schema instance with methods
 */
interface Schema<TDef extends SchemaDefinition = SchemaDefinition> {
    /** The schema definition */
    readonly definition: TDef;
    /** Custom prompt template for this schema */
    readonly promptTemplate?: PromptTemplate;
    /** Default rules baked into the schema (injected before customRules) */
    readonly defaultRules?: string[];
    /** Create a catalog from this schema */
    createCatalog<TCatalog extends InferCatalogInput<TDef["catalog"]>>(catalog: TCatalog): Catalog<TDef, TCatalog>;
}
/**
 * Catalog instance with methods
 */
interface Catalog<TDef extends SchemaDefinition = SchemaDefinition, TCatalog = unknown> {
    /** The schema this catalog is based on */
    readonly schema: Schema<TDef>;
    /** The catalog data */
    readonly data: TCatalog;
    /** Component names */
    readonly componentNames: string[];
    /** Action names */
    readonly actionNames: string[];
    /** Generate system prompt for AI */
    prompt(options?: PromptOptions): string;
    /** Export as JSON Schema for structured outputs */
    jsonSchema(): object;
    /** Validate a spec against this catalog */
    validate(spec: unknown): SpecValidationResult<InferSpec<TDef, TCatalog>>;
    /** Get the Zod schema for the spec */
    zodSchema(): z.ZodType<InferSpec<TDef, TCatalog>>;
    /** Type helper for the spec type */
    readonly _specType: InferSpec<TDef, TCatalog>;
}
/**
 * Prompt generation options
 */
interface PromptOptions {
    /** Custom system message intro */
    system?: string;
    /** Additional rules to append */
    customRules?: string[];
    /**
     * Output mode for the generated prompt.
     *
     * - `"generate"` (default): The LLM should output only JSONL patches (no prose).
     * - `"chat"`: The LLM should respond conversationally first, then output JSONL patches.
     *   Includes rules about interleaving text with JSONL and not wrapping in code fences.
     */
    mode?: "generate" | "chat";
}
/**
 * Context provided to prompt templates
 */
interface PromptContext<TCatalog = unknown> {
    /** The catalog data */
    catalog: TCatalog;
    /** Component names from the catalog */
    componentNames: string[];
    /** Action names from the catalog (if any) */
    actionNames: string[];
    /** Prompt options provided by the user */
    options: PromptOptions;
    /** Helper to format a Zod type as a human-readable string */
    formatZodType: (schema: z.ZodType) => string;
}
/**
 * Prompt template function type
 */
type PromptTemplate<TCatalog = unknown> = (context: PromptContext<TCatalog>) => string;
/**
 * Schema options
 */
interface SchemaOptions<TCatalog = unknown> {
    /** Custom prompt template for this schema */
    promptTemplate?: PromptTemplate<TCatalog>;
    /** Default rules baked into the schema (injected before customRules in prompts) */
    defaultRules?: string[];
}
/**
 * Spec validation result
 */
interface SpecValidationResult<T> {
    success: boolean;
    data?: T;
    error?: z.ZodError;
}
/**
 * Extract the components map type from a catalog
 * @example type Components = InferCatalogComponents<typeof myCatalog>;
 */
type InferCatalogComponents<C extends Catalog> = C extends Catalog<SchemaDefinition, infer TCatalog> ? TCatalog extends {
    components: infer Comps;
} ? Comps : never : never;
/**
 * Extract the actions map type from a catalog
 * @example type Actions = InferCatalogActions<typeof myCatalog>;
 */
type InferCatalogActions<C extends Catalog> = C extends Catalog<SchemaDefinition, infer TCatalog> ? TCatalog extends {
    actions: infer Acts;
} ? Acts : never : never;
/**
 * Infer component props from a catalog by component name
 * @example type ButtonProps = InferComponentProps<typeof myCatalog, 'Button'>;
 */
type InferComponentProps<C extends Catalog, K extends keyof InferCatalogComponents<C>> = InferCatalogComponents<C>[K] extends {
    props: z.ZodType<infer P>;
} ? P : never;
/**
 * Infer action params from a catalog by action name
 * @example type ViewCustomersParams = InferActionParams<typeof myCatalog, 'viewCustomers'>;
 */
type InferActionParams<C extends Catalog, K extends keyof InferCatalogActions<C>> = InferCatalogActions<C>[K] extends {
    params: z.ZodType<infer P>;
} ? P : never;
type InferCatalogInput<T> = T extends SchemaType<"object", infer Shape> ? {
    [K in keyof Shape]: InferCatalogField<Shape[K]>;
} : never;
type InferCatalogField<T> = T extends SchemaType<"map", infer EntryShape> ? Record<string, InferMapEntryRequired<EntryShape> & Partial<InferMapEntryOptional<EntryShape>>> : T extends SchemaType<"zod"> ? z.ZodType : T extends SchemaType<"string"> ? string : T extends SchemaType<"number"> ? number : T extends SchemaType<"boolean"> ? boolean : T extends SchemaType<"array", infer Item> ? InferCatalogField<Item>[] : T extends SchemaType<"object", infer Shape> ? {
    [K in keyof Shape]: InferCatalogField<Shape[K]>;
} : unknown;
type InferMapEntryRequired<T> = {
    [K in keyof T as K extends "props" ? K : never]: InferMapEntryField<T[K]>;
};
type InferMapEntryOptional<T> = {
    [K in keyof T as K extends "props" ? never : K]: InferMapEntryField<T[K]>;
};
type InferMapEntryField<T> = T extends SchemaType<"zod"> ? z.ZodType : T extends SchemaType<"string"> ? string : T extends SchemaType<"number"> ? number : T extends SchemaType<"boolean"> ? boolean : T extends SchemaType<"array", infer Item> ? InferMapEntryField<Item>[] : T extends SchemaType<"object", infer Shape> ? {
    [K in keyof Shape]: InferMapEntryField<Shape[K]>;
} : unknown;
type InferSpec<TDef extends SchemaDefinition, TCatalog> = TDef extends {
    spec: SchemaType<"object", infer Shape>;
} ? InferSpecObject<Shape, TCatalog> : unknown;
type InferSpecObject<Shape, TCatalog> = {
    [K in keyof Shape]: InferSpecField<Shape[K], TCatalog>;
};
type InferSpecField<T, TCatalog> = T extends SchemaType<"string"> ? string : T extends SchemaType<"number"> ? number : T extends SchemaType<"boolean"> ? boolean : T extends SchemaType<"array", infer Item> ? InferSpecField<Item, TCatalog>[] : T extends SchemaType<"object", infer Shape> ? InferSpecObject<Shape, TCatalog> : T extends SchemaType<"record", infer Value> ? Record<string, InferSpecField<Value, TCatalog>> : T extends SchemaType<"ref", infer Path> ? InferRefType<Path, TCatalog> : T extends SchemaType<"propsOf", infer Path> ? InferPropsOfType<Path, TCatalog> : T extends SchemaType<"any"> ? unknown : unknown;
type InferRefType<Path, TCatalog> = Path extends "catalog.components" ? TCatalog extends {
    components: infer C;
} ? keyof C : string : Path extends "catalog.actions" ? TCatalog extends {
    actions: infer A;
} ? keyof A : string : string;
type InferPropsOfType<Path, TCatalog> = Path extends "catalog.components" ? TCatalog extends {
    components: infer C;
} ? C extends Record<string, {
    props: z.ZodType<infer P>;
}> ? P : Record<string, unknown> : Record<string, unknown> : Record<string, unknown>;
/**
 * Define a schema using the builder pattern
 */
declare function defineSchema<TDef extends SchemaDefinition>(builder: (s: SchemaBuilder) => TDef, options?: SchemaOptions): Schema<TDef>;
/**
 * Shorthand: Define a catalog directly from a schema
 */
declare function defineCatalog<TDef extends SchemaDefinition, TCatalog extends InferCatalogInput<TDef["catalog"]>>(schema: Schema<TDef>, catalog: TCatalog): Catalog<TDef, TCatalog>;

/**
 * Options for building a user prompt.
 */
interface UserPromptOptions {
    /** The user's text prompt */
    prompt: string;
    /** Existing spec to refine (triggers patch-only mode) */
    currentSpec?: Spec | null;
    /** Runtime state context to include */
    state?: Record<string, unknown> | null;
    /** Maximum length for the user's text prompt (applied before wrapping) */
    maxPromptLength?: number;
}
/**
 * Build a user prompt for AI generation.
 *
 * Handles common patterns that every consuming app needs:
 * - Truncating the user's prompt to a max length
 * - Including the current spec for refinement (patch-only mode)
 * - Including runtime state context
 *
 * @example
 * ```ts
 * // Fresh generation
 * buildUserPrompt({ prompt: "create a todo app" })
 *
 * // Refinement with existing spec
 * buildUserPrompt({ prompt: "add a dark mode toggle", currentSpec: spec })
 *
 * // With state context
 * buildUserPrompt({ prompt: "show my data", state: { todos: [] } })
 * ```
 */
declare function buildUserPrompt(options: UserPromptOptions): string;

export { type Action, type ActionBinding, ActionBindingSchema, type ActionConfirm, ActionConfirmSchema, type ActionDefinition, type ActionExecutionContext, type ActionHandler, type ActionOnError, ActionOnErrorSchema, type ActionOnSuccess, ActionOnSuccessSchema, ActionSchema, type AndCondition, type Catalog, type ComponentSchema, type DynamicBoolean, DynamicBooleanSchema, type DynamicNumber, DynamicNumberSchema, type DynamicString, DynamicStringSchema, type DynamicValue, DynamicValueSchema, type FlatElement, type IndexCondition, type InferActionParams, type InferCatalogActions, type InferCatalogComponents, type InferCatalogInput, type InferComponentProps, type InferSpec, type ItemCondition, type JsonPatch, type MixedStreamCallbacks, type MixedStreamParser, type OrCondition, type PatchOp, type PromptContext, type PromptOptions, type PromptTemplate, type PropExpression, type PropResolutionContext, type ResolvedAction, SPEC_DATA_PART, SPEC_DATA_PART_TYPE, type Schema, type SchemaBuilder, type SchemaDefinition, type SchemaOptions, type SchemaType, type SingleCondition, type Spec, type SpecDataPart, type SpecIssue, type SpecIssueSeverity, type SpecStreamCompiler, type SpecStreamLine, type SpecValidationIssues, type SpecValidationResult, type StateCondition, type StateModel, type StreamChunk, type UIElement, type UserPromptOptions, type ValidateSpecOptions, type ValidationCheck, type ValidationCheckResult, ValidationCheckSchema, type ValidationConfig, ValidationConfigSchema, type ValidationContext, type ValidationFunction, type ValidationFunctionDefinition, type ValidationMode, type ValidationResult, type VisibilityCondition, VisibilityConditionSchema, type VisibilityContext, action, actionBinding, addByPath, applySpecPatch, applySpecStreamPatch, autoFixSpec, buildUserPrompt, builtInValidationFunctions, check, compileSpecStream, createJsonRenderTransform, createMixedStreamParser, createSpecStreamCompiler, defineCatalog, defineSchema, evaluateVisibility, executeAction, findFormValue, formatSpecIssues, getByPath, interpolateString, nestedToFlat, parseSpecStreamLine, pipeJsonRender, removeByPath, resolveAction, resolveActionParam, resolveBindings, resolveDynamicValue, resolveElementProps, resolvePropValue, runValidation, runValidationCheck, setByPath, validateSpec, visibility };
