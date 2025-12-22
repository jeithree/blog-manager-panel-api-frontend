import Link from 'next/link';
import {Button} from '@/components/ui/button';

export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-8">
			<div className="max-w-2xl text-center space-y-6">
				<h1 className="text-4xl font-bold">Welcome to Simple Next.js</h1>
				<p className="text-lg text-muted-foreground">
					A minimalist Next.js starter template with authentication and dashboard
				</p>
				<div className="flex gap-4 justify-center">
					<Link href="/login">
						<Button>Login</Button>
					</Link>
					<Link href="/register">
						<Button variant="outline">Register</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
