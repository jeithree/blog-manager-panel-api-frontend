'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import useSWR from 'swr';
import {updateProfileSchema, type UpdateProfileData} from '@/types/user';
import {getProfile, updateProfile} from '@/services/user';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {ApiError} from '@/types/api';

export default function ProfilePage() {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const {data: profileData, mutate} = useSWR('/api/v1/users/me', async () => {
		const response = await getProfile();
		return response.data;
	});

	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm<UpdateProfileData>({
		resolver: zodResolver(updateProfileSchema),
		values: {
			name: profileData?.name || '',
		},
	});

	const onSubmit = async (data: UpdateProfileData) => {
		setError('');
		setSuccess('');
		setIsLoading(true);

		try {
			await updateProfile(data);
			mutate();
			setSuccess('Profile updated successfully');
		} catch (err) {
			setError((err as ApiError).message || 'Failed to update profile');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Profile Settings</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4">
						{error && (
							<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
								{error}
							</div>
						)}

						{success && (
							<div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
								{success}
							</div>
						)}

						<div className="space-y-2">
							<Label>Username</Label>
							<Input
								value={profileData?.username || ''}
								disabled
							/>
							<p className="text-xs text-muted-foreground">Username cannot be changed</p>
						</div>

						<div className="space-y-2">
							<Label>Email</Label>
							<Input
								value={profileData?.email || ''}
								disabled
							/>
							<p className="text-xs text-muted-foreground">Email cannot be changed</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								{...register('name')}
							/>
							{errors.name && (
								<p className="text-sm text-destructive">{errors.name.message}</p>
							)}
						</div>

						<Button
							type="submit"
							disabled={isLoading}>
							{isLoading ? 'Updating...' : 'Update Profile'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
