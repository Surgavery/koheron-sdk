/// Autogenerated DO NOT EDIT
///
/// (c) Koheron

#ifndef __OPERATIONS_HPP__
#define __OPERATIONS_HPP__

namespace op {
{% for driver in drivers -%}
namespace {{ driver.name }} {
    {% for operation in driver.operations -%}
    constexpr uint32_t {{ operation['name'] }} = ({{ driver.id }} << 16) + {{ operation['id'] }};
    {% endfor -%}
}
{% endfor %}
}

#endif // __OPERATIONS_HPP__