/**
 * Add as an attribute to any element to show/hide based upon the users allowed permissions
 *
 * <div ng-if-permission="a_permission">
 *
 * For multiple permissions to check on as an "OR" clause separate with a comma
 * Below will render if the current user has either a_permission or b_permission
 *
 * <div ng-if-permission="a_permission, b_permission">
 *
 */
define(['angular','common/module-name','kylo-services'], function (angular,moduleName) {

    var getBlockNodes = function (nodes) {
        if (!nodes || !nodes.length) {
            return angular.element();
        }

        var startNode = nodes[0];
        var endNode = nodes[nodes.length - 1];

        if (startNode === endNode) {
            return angular.element(startNode);
        }

        var element = startNode;
        var elements = [element];

        do {
            element = element.nextSibling;
            if (!element) {
                break;
            }
            elements.push(element);
        }
        while (element !== endNode);

        return angular.element(elements);
    };

    var directive = ['$animate', '$compile', 'AccessControlService', function ($animate, $compile, AccessControlService) {
        return {
            scope: {},
            multiElement: true,
            transclude: 'element',
         //   priority: 600,
            terminal: true,
            restrict: 'A',
            $$tlb: true,
            link: function ($scope, $element, $attr, ctrl, $transclude) {
                var block, childScope, previousElements;
                console.log('ATTRS ',$attr)
                $attr.$observe('ngIfPermission', function(value,old) {
                    var value2 = $attr.ngIfPermission;
                    console.log('VALUE  ',value,value2)
                    if(value != undefined) {

                        var permissions = value.split(',');
                        AccessControlService.getUserAllowedActions()
                            .then(function (actionSet) {

                                console.log('RESOLVING!!! ',$attr,actionSet);

                                if (AccessControlService.hasAnyAction(permissions, actionSet.actions)) {
                                    if (!childScope) {
                                        $transclude(function (clone, newScope) {
                                            childScope = newScope;
                                            clone[clone.length++] = $compile.$$createComment('end ngIfPermission', $attr.ngIfPermission);
                                            // Note: We only need the first/last node of the cloned nodes.
                                            // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                                            // by a directive with templateUrl when its template arrives.
                                            block = {
                                                clone: clone
                                            };
                                            $animate.enter(clone, $element.parent(), $element);
                                        });
                                    }
                                } else {
                                    if (previousElements) {
                                        previousElements.remove();
                                        previousElements = null;
                                    }
                                    if (childScope) {
                                        childScope.$destroy();
                                        childScope = null;
                                    }
                                    if (block) {
                                        previousElements = getBlockNodes(block.clone);
                                        $animate.leave(previousElements).done(function (response) {
                                            if (response !== false) previousElements = null;
                                        });
                                        block = null;
                                    }
                                }
                            },true);
                    }
                });

            }
        };
    }];

    angular.module(moduleName)
        .directive('ngIfPermission', directive);
});