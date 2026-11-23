import { Tooltip as AntdTooltip } from 'antd';

// A short hint on hover and keyboard focus. The child must be an element that can be focused (e.g. a Button).
// Never put the only explanation of something in a tooltip: touch screens cannot hover.
const Tooltip = ({ title, placement = 'top', children }) => {
    return (
        <AntdTooltip title={title} placement={placement}>
            {children}
        </AntdTooltip>
    );
};

export default Tooltip;
