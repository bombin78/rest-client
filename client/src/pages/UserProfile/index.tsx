import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
	Button,
	Card,
	Image,
	useDisclosure,
} from "@nextui-org/react";
import {
	MdOutlinePersonAddAlt1,
	MdOutlinePersonAddDisabled,
} from "react-icons/md";
import {
	useAppDispatch,
	useAppSelector,
} from "../../app/hooks";
import {
	resetUser,
	selectCurrent,
} from "../../features/user/userSlice";
import {
	useGetUserByIdQuery,
	useLazyCurrentQuery,
	useLazyGetUserByIdQuery,
} from "../../app/services/userApi";
import {
	useFollowUserMutation,
	useUnfollowUserMutation,
} from "../../app/services/followsApi";
import { GoBack } from "../../components/GoBack";
import { BASE_URL } from "../../constants";
import { CiEdit } from "react-icons/ci";
import { ProfileInfo } from "../../components/ProfileInfo";
import { formatToClientDate } from "../../utils/formatToClientDate";
import { CountInfo } from "../../components/CountInfo";
import { EditProfile } from "../../components/EditProfile";

export const UserProfile = () => {
	const { id } = useParams<{ id: string }>();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const currentUser = useAppSelector(selectCurrent);
	const { data } = useGetUserByIdQuery(id ?? '');
	const [followUser] = useFollowUserMutation();
	const [unfollowUser] = useUnfollowUserMutation();
	const [triggerGetUserByIdQuery] = useLazyGetUserByIdQuery();
	const [triggerCurrentQuery] = useLazyCurrentQuery();

	const dispatch = useAppDispatch();

	useEffect(() => () => {
		dispatch(resetUser());
	}, [dispatch]);

	const handleFollow = async () => {
		try {
			if (id) {
				data?.isFollowing
					? await unfollowUser(id).unwrap()
					: await followUser({ followingId: id }).unwrap();

				// Текущий пользователь и пользователь профиль, которого открыт
				// могут быть разными, поэтому в этом проекте и существует два запроса
				await triggerGetUserByIdQuery(id);
				await triggerCurrentQuery();
			}
		} catch (error) {
			console.log(error);
		}
	}

	const handleClose = async () => {
		try {
			if (id) {
				await triggerGetUserByIdQuery(id);
				await triggerCurrentQuery();
				onClose();
			}
		} catch (error) {
			console.error(error);
		}
	};

	if (!data) {
		return null;
	}

	return (
		<>
			<GoBack />
			<div className="flex items-center gap-4">
				<Card className="flex flex-col items-center text-center space-y-4 p-5 flex-2">
					<Image
						src={`${BASE_URL}${data?.avatarUrl}`}
						alt={data.name}
						width={200}
						height={200}
						className="border-4 border-white"
					/>
					<div className="flex flex-coll text-2xl font-bold gap-4 item-center">
						{data.name}
						{currentUser?.id !== id
							? (
								<Button
									color={data.isFollowing ? 'default' : 'primary'}
									variant='flat'
									className="gap-2"
									onClick={handleFollow}
									endContent={
										data.isFollowing ? (
											<MdOutlinePersonAddDisabled />
										) : (
											<MdOutlinePersonAddAlt1 />
										)
									}
								>
									{data.isFollowing ? 'Отписаться' : 'Подписаться'}
								</Button>
							)
							: (
								<Button
									onClick={() => onOpen()}
									endContent={<CiEdit />}
								>
									Редактировать
								</Button>
							)
						}
					</div>
				</Card>

				<Card className="flex flex-col space-y-4 p-5 flex-1">
					<ProfileInfo title="Почта" info={data.email} />
					<ProfileInfo title="Местоположение" info={data.location} />
					<ProfileInfo
						title="Дата рождения"
						info={formatToClientDate(data.dateOfBirth)}
					/>
					<ProfileInfo title="Обо мне" info={data.bio} />

					<div className="flex gap-2">
						<CountInfo
							title="Подписчики"
							count={data.followers.length}
						/>
						<CountInfo
							title="Подписки"
							count={data.following.length}
						/>
					</div>
				</Card>
			</div>

			<EditProfile
				isOpen={isOpen}
				onClose={handleClose}
				user={data}
			/>
		</>
	);
};