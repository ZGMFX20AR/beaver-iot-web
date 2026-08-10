import { Link } from 'react-router-dom';
import cls from 'classnames';
import './style.less';

interface Props {
    /** Jump address */
    to?: string;

    /** Whether the Logo is Mini */
    mini?: boolean;

    /** placeholder */
    placeholder?: string;

    /** Custom class name */
    className?: string;
}

/**
 * Logo component
 */
const Logo: React.FC<Props> = ({ to, mini, className, placeholder = 'Cytron Technologies' }) => {
    const content = (
        <>
            <span className="ms-logo-icon" />
            {!mini && <span className="ms-logo-text">{placeholder}</span>}
        </>
    );

    return (
        <h3 className={cls('ms-logo', className, { 'ms-logo-mini': mini })}>
            {!to ? (
                <span className="ms-logo-inner">{content}</span>
            ) : (
                <Link className="ms-logo-inner" to={to}>
                    {content}
                </Link>
            )}
        </h3>
    );
};

export default Logo;
