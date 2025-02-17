import { getPostData } from '@/lib/posts';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface PageParams {
    params: {
        slug: string;
    };
}

export async function generateMetadata({ params }: PageParams) {
    const response = await getPostData(params.slug);
    if (!response.success || !response.data) {
        return {
            title: 'Post Not Found',
            description: 'The requested post could not be found',
        };
    }

    return {
        title: response.data.title,
        description: response.data.description || `Read about ${response.data.title} on GitBase`,
    };
}

export default async function Post({ params }: PageParams) {
    const response = await getPostData(params.slug);

    if (!response.success || !response.data) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <h1 className="text-2xl font-bold text-red-600">Post Not Found</h1>
                <p className="mt-4">The requested post could not be found.</p>
                <Link href="/posts" className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-2 mt-4">
                    <ArrowLeft size={20} />
                    Back to articles
                </Link>
            </div>
        );
    }

    const postData = response.data;

    return (
        <article className="container mx-auto px-4 py-12 max-w-3xl">
            {/* Breadcrumb navigation */}
            <nav className="flex items-center text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-blue-600">Home</Link>
                <ChevronRight className="mx-2" size={16} />
                <Link href="/posts" className="hover:text-blue-600">Articles</Link>
                <ChevronRight className="mx-2" size={16} />
                <span className="text-gray-900">{postData.title}</span>
            </nav>

            {/* Meta information card */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8">
                {postData.date && (
                    <p className="text-gray-600 mb-2">{new Date(postData.date).toLocaleDateString()}</p>
                )}
                {postData.description && (
                    <p className="text-gray-800">{postData.description}</p>
                )}
            </div>

            {/* Article content */}
            <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
            />

            {/* Back to articles link */}
            <div className="mt-12">
                <Link href="/posts" className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-2">
                    <ArrowLeft size={20} />
                    Back to articles
                </Link>
            </div>
        </article>
    );
}
