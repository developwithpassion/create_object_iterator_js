import map_path_init from '@developwithpassion/map_path_init_js';
import { nested_property_setter } from '@developwithpassion/core_utils_js';
import { expect } from 'chai';
import create from './create';

const create_sut = attrs => {
  const details = {
    skip: () => false,
    nested_constraint: () => false,
    key_prefix: '',
    object_traversal_begin_handler: () => {},
    object_traversal_complete_handler: () => {},
    ...attrs
  };

  return create(details);
};

describe('iterating an object', () => {
  describe('without nested attributes', () => {
    let properties;
    let target;
    let sut;

    beforeEach(() => {
      properties = [];

      target = {
        age: 23,
        number: 23
      };
    });

    describe('and attributes are not configured to be skipped', () => {
      beforeEach(() => {
        sut = create_sut({
          target: target
        });
      });

      beforeEach(() => {
        sut(pair => {
          properties.push(pair);
        });
      });

      it('causes each of the properties to be visited', () => {
        expect(properties.length).to.eql(2);
      });
    });

    describe('and attributes are configured to be skipped', () => {
      beforeEach(() => {
        target = {
          age: 23,
          number: 23
        };
      });
      beforeEach(() => {
        sut = create_sut({
          target: target,
          skip: pair => pair.key === 'age'
        });
      });

      beforeEach(() => {
        sut(pair => {
          properties.push(pair);
        });
      });

      it('does not visit the attributes targeted to be skipped', () => {
        expect(properties.length).to.eql(1);
      });
    });
  });

  describe('with nested attributes', () => {
    let properties;
    let target;
    let sut;
    let nested_constraint;
    let city;
    let nested_object;
    let ignored_nested_object;

    beforeEach(() => {
      city = 'city';

      nested_constraint = item => item === nested_object;

      nested_object = {
        city: city
      };

      ignored_nested_object = {
        ignored: true
      };

      properties = [];

      target = {
        age: 23,
        number: 23,
        address: nested_object,
        other_nested: ignored_nested_object
      };
    });

    beforeEach(() => {
      sut = create_sut({
        target: target,
        nested_constraint: nested_constraint,
        skip: pair => {
          let match = val => isNaN(val) && val === ignored_nested_object;

          return match(pair.value);
        }
      });
    });

    beforeEach(() => {
      sut(pair => {
        properties.push(pair);
      });
    });

    it('traverses the nested object if its nested constraint is satisfied', () => {
      expect(properties.length).to.eql(3);
    });

    it('appends the prefix to nested attributes', () => {
      expect(properties[2].key).to.eql('address.city');
    });
  });

  describe('with deep nesting', () => {
    let properties;
    let target;
    let sut;
    let nested_constraint;

    beforeEach(() => {
      nested_constraint = value => typeof value === 'object';

      properties = [];

      target = {
        age: 23,
        number: 23,
        address: {
          city: 'newcastle',
          details: {
            county: 'durham',
            country: 'uk'
          }
        },
        person: {
          contact: {
            details: {
              name: 'JP'
            }
          }
        }
      };
    });

    beforeEach(() => {
      sut = create_sut({
        target: target,
        nested_constraint,
        skip: pair => false
      });
    });

    beforeEach(() => {
      sut(pair => {
        properties.push(pair);
      });
    });

    it('traverses all the leaf attributes', () => {
      expect(properties.length).to.eql(6);
    });
  });

  describe('with deep nesting of values that are empty objects', () => {
    let properties;
    let target;
    let copy;
    let sut;

    beforeEach(() => {
      properties = [];

      target = {
        age: null,
        number: null,
        address: {
          city: null,
          details: {
            county: null,
            country: {
              last: 'Hello'
            }
          }
        },
        person: {
          contact: {
            details: {
              name: {}
            }
          }
        }
      };

      copy = {};
    });

    beforeEach(() => {
      sut = create_sut({
        target: target,
        nested_constraint: val =>
          typeof val === 'object' && val !== null && Object.keys(val).length > 0
      });
    });

    beforeEach(() => {
      sut(pair => {
        map_path_init(pair.key, copy, () => {
          return {};
        });

        nested_property_setter(pair.key, pair.value, copy);
        properties.push(pair);
      });
    });

    it('does a correct copy', () => {
      expect(properties.length).to.eql(6);
      expect(copy.address.details.county).to.be.null;
      expect(copy.address.details.country === target.address.details.country).to.be.false;
    });
  });
});
