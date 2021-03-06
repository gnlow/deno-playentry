import { Lw, LwInterface } from "./deps.ts"

import { basicFetch, LwProp } from "./util.ts"
import Project from "./Project.ts"

interface UserConstructor {
    language?: string
    /** 유저의 신분. */
    role?: "member" | "teacher" | "admin"
    /** 유저의 식별자. 24자리의 16진수. */
    id?: string
    /** 유저의 닉네임(아이디). */
    username: string
    /** 유저가 작성한 마이페이지 설명. */
    description?: string
    /** 유저의 프로필 사진 URL. */
    avatarURL?: string
}
type _LwProp<N extends keyof UserConstructor> = LwProp<UserConstructor, N>
/** 엔트리 유저를 나타낸다. */
export default class User implements LwInterface<UserConstructor> {
    @Lw("getInfo") language: _LwProp<"language">
    @Lw("getInfo") role: _LwProp<"role">
    @Lw("getInfo") id: _LwProp<"id">
    username
    @Lw("getInfo") description: _LwProp<"description">
    @Lw("getInfo") avatarURL: _LwProp<"avatarURL">
    constructor(info: UserConstructor) {
        this.language = info.language!
        this.role = info.role!
        this.id = info.id!
        this.username = info.username,
        this.description = info.description!
        this.avatarURL = info.avatarURL!
    }
    /** 유저가 제작한 작품들의 목록을 가져온다. `sort` 옵션이 `"complexity"`나 `"staffPicked"`인 경우 일부 작품이 포함되지 않는다. */
    async findProjects(options?: {
        sort?: "updated" | "recent" | "complexity" | "staffPicked" | "childCnt" | "recentLikeCnt"
        rows?: number
    }) {
        const res: {
            data: any[]
        } = await basicFetch("project/find", {
            user: await this.id,
            sort: options?.sort || "recent",
            rows: options?.rows?.toString() || "0",
            blamed: "false",
        })
        const projects = res.data.map(project => {
            const info = {
                id: project._id,
                name: project.name,
                owner: this,
                thumbURL: "https://playentry.org/" + project.thumb,
                updated: project.updated,
                visitCount: project.visit,
                likeCount: project.likeCnt,
                recentLikeCount: project.recentLikeCnt,
                commentCount: project.comment,
                childCount: project.childCnt,
            }
            return new Project(info)
        })
        return projects
    }
    /** 유저의 닉네임(아이디)으로 정보를 불러온다. 유저가 존재하지 않는다면 `undefined`를 반환한다. */
    async getInfo() {
        const res = await basicFetch(`getUserByUsername/${this.username}`)
        if (res) {
            let info = Object.assign(res, {
                id: res._id,
                avatarURL: 
                    res.avatarImage 
                        ? `https://playentry.org/uploads/profile/${res._id.substring(0, 2)}/${res._id.substring(2, 4)}/avatar_${res._id}.png`
                        : "https://playentry.org/img/assets/avatar_img.png"
            })
            Object.assign(this, info)
        }
    }
}