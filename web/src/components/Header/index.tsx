
export const links = [
    { link: '/about', label: 'Features' },
    {
        link: '#1',
        label: 'Learn',
        links: [
            { link: '/docs', label: 'Documentation' },
            { link: '/resources', label: 'Resources' },
            { link: '/community', label: 'Community' },
            { link: '/blog', label: 'Blog' },
        ],
    },
    { link: '/about', label: 'About' },
    { link: '/pricing', label: 'Pricing' },
    {
        link: '#2',
        label: 'Support',
        links: [
            { link: '/faq', label: 'FAQ' },
            { link: '/demo', label: 'Book a demo' },
            { link: '/forums', label: 'Forums' },
        ],
    },
];

type Link = {
    link: string;
    label: string;
    links?: {
        link: string;
        label: string;
    } [];
}

type Props = {
    links: Link[];
}

export const HeaderMenu = ({links}: Props) => (
    <div>s</div>
)