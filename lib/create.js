import each_property_pair from '@developwithpassion/simple_object_iterator_js';

const no_op = () => {};

const create_key_prefix = (key_prefix, key) => {
  const next_prefix = key + '.';

  const result = key_prefix === '' ? next_prefix : key_prefix + next_prefix;

  return result;
};

const create_next_iterator = (key, next_target, iterator_attributes) =>
  create(
    Object.assign({}, iterator_attributes, {
      target: next_target,
      key_prefix: create_key_prefix(iterator_attributes.key_prefix, key)
    })
  );

const create_visitor = (handler, raw_handler, iterator_attributes) => (key, value) => {
  raw_handler = raw_handler || no_op;

  const { nested_constraint, skip, key_prefix } = iterator_attributes;

  const pair = {
    key: key,
    value: value
  };

  const pair_data = {
    key: key_prefix + key,
    value: value
  };

  raw_handler(pair_data);

  if (nested_constraint(value)) {
    const nested_iterator = create_next_iterator(key, value, iterator_attributes);
    nested_iterator(handler, raw_handler);
  } else {
    if (!skip(pair)) handler(pair_data);
  }
};

const create = iterator_attributes => {
  const all_iterator_attributes = Object.assign({}, defaults(), iterator_attributes);

  const {
    object_traversal_begin_handler,
    key_prefix,
    target,
    object_traversal_complete_handler
  } = all_iterator_attributes;

  return (handler, raw_handler) => {
    const visitor = create_visitor(handler, raw_handler, all_iterator_attributes);

    object_traversal_begin_handler(normalize_key_prefix(key_prefix), target);

    each_property_pair(target, visitor);

    object_traversal_complete_handler(key_prefix, target, all_iterator_attributes);
  };
};

const defaults = () => ({
  key_prefix: '',
  nested_constraint: () => false,
  skip: () => false,
  object_traversal_begin_handler: no_op,
  object_traversal_complete_handler: no_op
});

const normalize_key_prefix = key => (key.endsWith('.') ? key.substr(0, key.length - 1) : key);

export default create;
